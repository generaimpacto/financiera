import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, PercentCircle, Wallet } from 'lucide-react'
import { getViewClientId } from '@/lib/viewClient'
import { getSession } from '@/lib/session'

function formatCurrency(val: number) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val)
}

interface MonthData {
    key: string
    label: string
    income: number
    expenses: number
    commission: number
    commissionPaid: number
    balance: number
}

export default async function MonthlySummaryPage() {
    const supabase = await createClient()
    const { user, profile } = await getSession()
    if (!user) redirect('/login')

    const commissionPercentage = profile?.commission_percentage || 0
    const isAdmin = profile?.role === 'admin'

    // Fetch all profiles for admin commission calculation
    let commissionMap = new Map<string, number>()
    if (isAdmin) {
        const { data: allProfiles } = await supabase.from('profiles').select('id, commission_percentage')
        commissionMap = new Map(allProfiles?.map(p => [p.id, p.commission_percentage]) || [])
    }

    // "Ver como cliente": filtrar a ese cliente si está seleccionado.
    const viewClientId = isAdmin ? await getViewClientId() : ''

    let pq = supabase
        .from('payments')
        .select('amount, payment_date, user_id')
        .order('payment_date', { ascending: true })
    if (viewClientId) pq = pq.eq('user_id', viewClientId)
    const { data: payments } = await pq

    let eq = supabase
        .from('expenses')
        .select('amount, expense_date, user_id, is_commission_payment')
        .order('expense_date', { ascending: true })
    if (viewClientId) eq = eq.eq('user_id', viewClientId)
    const { data: expenses } = await eq

    // Group by month
    const monthMap = new Map<string, MonthData>()

    payments?.forEach(p => {
        const d = new Date(p.payment_date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(d)

        if (!monthMap.has(key)) {
            monthMap.set(key, { key, label, income: 0, expenses: 0, commission: 0, commissionPaid: 0, balance: 0 })
        }
        const m = monthMap.get(key)!
        const amt = Number(p.amount)
        m.income += amt

        if (isAdmin) {
            const commPct = commissionMap.get(p.user_id) || 0
            m.commission += (amt * commPct) / 100
        } else {
            m.commission += (amt * commissionPercentage) / 100
        }
    })

    expenses?.forEach(e => {
        const d = new Date(e.expense_date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(d)

        if (!monthMap.has(key)) {
            monthMap.set(key, { key, label, income: 0, expenses: 0, commission: 0, commissionPaid: 0, balance: 0 })
        }
        const m = monthMap.get(key)!
        m.expenses += Number(e.amount)
        // Los pagos de comisión se restan de la comisión pendiente del mes (no doble cuentan).
        if ((e as any).is_commission_payment) m.commissionPaid += Number(e.amount)
    })

    // Calculate balances
    const months = Array.from(monthMap.values())
        .sort((a, b) => b.key.localeCompare(a.key)) // Most recent first

    months.forEach(m => {
        if (isAdmin) {
            m.balance = m.commission // Admin's balance = commissions earned
        } else {
            // Egresos incluyen todo; restamos solo la comisión pendiente (generada − cobrada).
            m.balance = m.income - m.expenses - (m.commission - m.commissionPaid)
        }
    })

    // Totals
    const totalIncome = months.reduce((acc, m) => acc + m.income, 0)
    const totalExpenses = months.reduce((acc, m) => acc + m.expenses, 0)
    const totalCommission = months.reduce((acc, m) => acc + m.commission, 0)
    const totalBalance = months.reduce((acc, m) => acc + m.balance, 0)

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-white transition-colors mb-6">
                <ArrowLeft size={16} /> Volver al Dashboard
            </Link>

            <header className="mb-8">
                {!isAdmin && profile?.business_name && (
                    <p className="text-sm text-blue-400 font-medium mb-1">{profile.business_name}</p>
                )}
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    Resumen Mensual
                </h1>
                <p className="text-secondary mt-2">Desglose mes a mes de tus finanzas</p>
            </header>

            {/* Totals Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="glass-card p-4 border-t-2 border-t-emerald-500">
                    <p className="text-secondary text-xs font-medium mb-1">{isAdmin ? 'Volumen Total' : 'Ingresos Totales'}</p>
                    <h3 className="text-xl font-bold text-emerald-400">{formatCurrency(totalIncome)}</h3>
                </div>
                <div className="glass-card p-4 border-t-2 border-t-red-500">
                    <p className="text-secondary text-xs font-medium mb-1">Egresos Totales</p>
                    <h3 className="text-xl font-bold text-red-400">{formatCurrency(totalExpenses)}</h3>
                </div>
                <div className="glass-card p-4 border-t-2 border-t-purple-500">
                    <p className="text-secondary text-xs font-medium mb-1">{isAdmin ? 'Comisiones Totales' : 'Comisión Total'}</p>
                    <h3 className="text-xl font-bold text-purple-400">{formatCurrency(totalCommission)}</h3>
                </div>
                <div className="glass-card p-4 border-t-2 border-t-blue-500">
                    <p className="text-secondary text-xs font-medium mb-1">{isAdmin ? 'Ganancia Total' : 'Balance Total'}</p>
                    <h3 className="text-xl font-bold text-blue-400">{formatCurrency(totalBalance)}</h3>
                </div>
            </div>

            {/* Monthly Breakdown Table */}
            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20 text-secondary text-sm">
                                <th className="px-5 py-3 font-medium">Mes</th>
                                <th className="px-5 py-3 font-medium text-right">
                                    <span className="flex items-center justify-end gap-1"><TrendingUp size={14} className="text-emerald-400" /> Ingresos</span>
                                </th>
                                <th className="px-5 py-3 font-medium text-right">
                                    <span className="flex items-center justify-end gap-1"><TrendingDown size={14} className="text-red-400" /> Egresos</span>
                                </th>
                                <th className="px-5 py-3 font-medium text-right">
                                    <span className="flex items-center justify-end gap-1"><PercentCircle size={14} className="text-purple-400" /> {isAdmin ? 'Comisión' : 'Comisión'}</span>
                                </th>
                                <th className="px-5 py-3 font-medium text-right">
                                    <span className="flex items-center justify-end gap-1"><Wallet size={14} className="text-blue-400" /> {isAdmin ? 'Ganancia' : 'Balance'}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {months.map((m) => (
                                <tr key={m.key} className="border-b border-[var(--border-color)] hover:bg-white/5 transition-colors text-sm">
                                    <td className="px-5 py-4 text-white font-medium capitalize">{m.label}</td>
                                    <td className="px-5 py-4 text-right text-emerald-400 font-bold">{formatCurrency(m.income)}</td>
                                    <td className="px-5 py-4 text-right text-red-400 font-bold">{formatCurrency(m.expenses)}</td>
                                    <td className="px-5 py-4 text-right text-purple-400 font-bold">{formatCurrency(m.commission)}</td>
                                    <td className={`px-5 py-4 text-right font-bold ${m.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                        {formatCurrency(m.balance)}
                                    </td>
                                </tr>
                            ))}
                            {months.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-secondary">
                                        No hay movimientos registrados
                                    </td>
                                </tr>
                            )}
                            {/* Totals Footer */}
                            {months.length > 0 && (
                                <tr className="bg-white/5 border-t-2 border-[var(--border-color)]">
                                    <td className="px-5 py-4 text-white font-bold text-sm">TOTAL ACUMULADO</td>
                                    <td className="px-5 py-4 text-right text-emerald-400 font-bold">{formatCurrency(totalIncome)}</td>
                                    <td className="px-5 py-4 text-right text-red-400 font-bold">{formatCurrency(totalExpenses)}</td>
                                    <td className="px-5 py-4 text-right text-purple-400 font-bold">{formatCurrency(totalCommission)}</td>
                                    <td className={`px-5 py-4 text-right font-bold ${totalBalance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                        {formatCurrency(totalBalance)}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
