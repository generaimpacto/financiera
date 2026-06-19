import { createClient } from '@/utils/supabase/server'
import { Wallet, TrendingUp, TrendingDown, PercentCircle, Download, Receipt, Pencil, Trash2, CalendarRange } from 'lucide-react'
import { deleteTransactionAction } from './actions'
import { RevenueChart } from '@/components/RevenueChart'
import Link from 'next/link'
import { DashboardClientSelector } from '@/components/DashboardClientSelector'
import { getViewClientId } from '@/lib/viewClient'
import { getSession } from '@/lib/session'
import { DateRangeFilter } from '@/components/DateRangeFilter'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ clientId?: string; desde?: string; hasta?: string }> }) {
    const supabase = await createClient()
    const { user, profile } = await getSession()

    // Date calculations for current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const commissionPercentage = profile?.commission_percentage || 0
    const isAdmin = profile?.role === 'admin'

    // Fetch all profiles map for admin calculations
    const { data: allProfiles } = await supabase.from('profiles').select('id, commission_percentage, role, business_name')
    const commissionMap = new Map(allProfiles?.map(p => [p.id, p.commission_percentage]) || [])
    const nameMap = new Map(allProfiles?.map(p => [p.id, p.business_name || `Cliente ${p.id.split('-')[0]}`]) || [])

    const clients = allProfiles?.filter(p => p.role === 'user') || []

    const params = await searchParams
    // "Ver como cliente" (sidebar): default cuando no hay ?clientId explícito.
    const viewClientId = isAdmin ? await getViewClientId() : ''
    let activeClientId = params.clientId

    if (isAdmin) {
        if (!activeClientId) {
            activeClientId = viewClientId || (clients.length > 0 ? clients[0].id : 'all')
        }
    } else {
        activeClientId = user?.id
    }

    // Filtro por rango de fechas (afecta tarjetas y movimientos recientes).
    const desde = params.desde || ''
    const hasta = params.hasta || ''

    // 2. Fetch Payments (Income) — con filtro de fechas
    let payQ = supabase
        .from('payments')
        .select('id, amount, payment_date, client_name, user_id')
        .order('payment_date', { ascending: false })
    if (desde) payQ = payQ.gte('payment_date', desde)
    if (hasta) payQ = payQ.lte('payment_date', hasta)
    const { data: payments } = await payQ

    // 3. Fetch Expenses — con filtro de fechas
    let expQ = supabase
        .from('expenses')
        .select('id, amount, expense_date, description, user_id, is_commission_payment')
    if (desde) expQ = expQ.gte('expense_date', desde)
    if (hasta) expQ = expQ.lte('expense_date', hasta)
    const { data: expenses } = await expQ

    // Filter data based on selected client (if activeClientId is not 'all')
    const showAll = activeClientId === 'all'
    const filteredPayments = showAll ? (payments || []) : (payments || []).filter(p => p.user_id === activeClientId)
    const filteredExpenses = showAll ? (expenses || []) : (expenses || []).filter(e => e.user_id === activeClientId)

    const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
    // Pagos de comisión que el/los cliente(s) ya hicieron a la agencia.
    const commissionPaid = filteredExpenses.filter((e: any) => e.is_commission_payment).reduce((acc, c) => acc + Number(c.amount), 0)

    // Combine and sort transactions
    const mergedTransactions = [
        ...filteredPayments.map(p => ({
            id: p.id,
            date: p.payment_date,
            description: p.client_name,
            amount: Number(p.amount),
            type: 'income',
            ownerName: nameMap.get(p.user_id) || ''
        })),
        ...filteredExpenses.map(e => ({
            id: e.id,
            date: e.expense_date,
            description: e.description,
            amount: Number(e.amount),
            type: 'expense',
            ownerName: nameMap.get(e.user_id) || ''
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 4. Calculations
    let totalIncome = 0
    let totalCommissions = 0

    filteredPayments.forEach(p => {
        const amt = Number(p.amount)
        totalIncome += amt
        if (isAdmin) {
            const commPct = commissionMap.get(p.user_id) || 0
            totalCommissions += (amt * commPct) / 100
        }
    })

    if (!isAdmin) {
        totalCommissions = (totalIncome * commissionPercentage) / 100
    }

    // Comisión: generada (sobre ingresos) − cobrada (pagos de comisión) = pendiente.
    const commissionGenerated = totalCommissions
    const commissionPending = commissionGenerated - commissionPaid
    const balance = isAdmin ? totalCommissions : (totalIncome - totalExpenses - commissionPending)

    // 5. Fetch 6-months Data for Chart
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()
    const { data: historicalPayments } = await supabase
        .from('payments')
        .select('amount, payment_date, user_id')
        .gte('payment_date', sixMonthsAgo)
        .order('payment_date', { ascending: true })

    const filteredHistoricalPayments = showAll ? (historicalPayments || []) : (historicalPayments || []).filter(p => p.user_id === activeClientId)

    const monthlyData = new Map<string, number>()

    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(d).toUpperCase()
        monthlyData.set(monthName, 0)
    }

    // Aggregate real data
    filteredHistoricalPayments.forEach(p => {
        const d = new Date(p.payment_date)
        const monthName = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(d).toUpperCase()
        if (monthlyData.has(monthName)) {
            let valueToAdd = Number(p.amount)
            if (isAdmin) {
                const commPct = commissionMap.get(p.user_id) || 0
                valueToAdd = (valueToAdd * commPct) / 100
            }
            monthlyData.set(monthName, monthlyData.get(monthName)! + valueToAdd)
        }
    })

    const chartData = Array.from(monthlyData, ([name, total]) => ({ name, total }))

    // Formatter plugin
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val)

    const activeClientName = clients.find(c => c.id === activeClientId)?.business_name || `Cliente ${activeClientId?.split('-')[0]}`

    // % de comisión a mostrar en el badge: para admin viendo un cliente, la del cliente
    // (no la propia, que es 0). Para "Todos" o no-admin, la del perfil logueado.
    const displayCommissionPct = isAdmin
        ? (showAll ? commissionPercentage : (Number(commissionMap.get(activeClientId ?? '')) || 0))
        : commissionPercentage

    return (
        <div className="animate-fade-in">
            <header className="mb-8">
                {!isAdmin && profile?.business_name && (
                    <p className="text-sm text-blue-400 font-medium mb-1">{profile.business_name}</p>
                )}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                            Resumen {isAdmin && !showAll ? 'por Cliente' : 'General'}
                        </h1>
                        <p className="text-secondary mt-2">
                            {isAdmin 
                                ? (showAll ? 'Acumulado consolidado de todos los clientes' : `Mostrando datos de: ${activeClientName}`) 
                                : 'Acumulado total de todas tus finanzas'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {isAdmin && clients.length > 0 && (
                            <DashboardClientSelector clients={clients} activeClientId={activeClientId || ''} />
                        )}
                        <DateRangeFilter />
                        <Link
                            href="/dashboard/monthly-summary"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:text-white"
                        >
                            <CalendarRange size={18} />
                            Resumen Mensual
                        </Link>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Income Card */}
                <div className="glass-card p-6 border-t-4 border-t-emerald-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp size={64} className="text-emerald-500" />
                    </div>
                    <p className="text-secondary font-medium mb-1 relative z-10">{isAdmin ? 'Volumen Generado (Total)' : 'Ingresos (Total)'}</p>
                    <h3 className="text-3xl font-bold text-white relative z-10">{formatCurrency(totalIncome)}</h3>
                </div>

                {/* Expenses Card */}
                <div className="glass-card p-6 border-t-4 border-t-red-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingDown size={64} className="text-red-500" />
                    </div>
                    <p className="text-secondary font-medium mb-1 relative z-10">Egresos (Total)</p>
                    <h3 className="text-3xl font-bold text-white relative z-10">{formatCurrency(totalExpenses)}</h3>
                </div>

                {/* Balance Card */}
                <div className="glass-card p-6 border-t-4 border-t-blue-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet size={64} className="text-blue-500" />
                    </div>
                    <p className="text-secondary font-medium mb-1 relative z-10">{isAdmin ? 'Nuestras Ganancias' : 'Balance Neto'}</p>
                    <h3 className="text-3xl font-bold text-white relative z-10">{formatCurrency(balance)}</h3>
                </div>

                {/* Commission Card */}
                <div className="glass-card p-6 border-t-4 border-t-purple-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <PercentCircle size={64} className="text-purple-500" />
                    </div>
                    <div className="flex justify-between items-center mb-1 relative z-10">
                        <p className="text-secondary font-medium">{isAdmin ? 'Comisiones a Cobrar' : 'Comisión a Pagar'} <span className="text-xs opacity-70">(pendiente)</span></p>
                        <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded font-bold">
                            {displayCommissionPct}%
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white relative z-10">{formatCurrency(commissionPending)}</h3>
                    <p className="text-xs text-secondary mt-1 relative z-10">
                        Generada {formatCurrency(commissionGenerated)} · Cobrada {formatCurrency(commissionPaid)}
                    </p>
                </div>
            </div>

            {/* Revenue Growth Chart */}
            <div className="mb-6">
                <RevenueChart data={chartData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Transactions placeholder */}
                <div className="glass-panel p-8 lg:col-span-2">
                    <h2 className="text-xl font-bold mb-6">Últimos Movimientos</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 text-secondary text-sm">
                                    <th className="px-4 py-3 font-medium">Fecha</th>
                                    {isAdmin && <th className="px-4 py-3 font-medium">Cliente</th>}
                                    <th className="px-4 py-3 font-medium">Monto</th>
                                    <th className="px-4 py-3 font-medium">Tipo</th>
                                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mergedTransactions.slice(0, 10).map((t, i) => (
                                    <tr key={i} className="border-b border-[var(--border-color)] text-sm group">
                                        <td className="px-4 py-3">{t.date}</td>
                                        {isAdmin && <td className="px-4 py-3 text-blue-300 text-xs font-medium">{t.ownerName}</td>}
                                        <td className={`px-4 py-3 font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {t.type === 'income' ? (
                                                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs">Pago</span>
                                            ) : (
                                                <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs">Egreso</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <a href={t.type === 'income' ? `/dashboard/payments/${t.id}/edit` : `/dashboard/expenses/${t.id}/edit`} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors" title="Editar">
                                                    <Pencil size={16} />
                                                </a>
                                                <form action={deleteTransactionAction}>
                                                    <input type="hidden" name="id" value={t.id} />
                                                    <input type="hidden" name="type" value={t.type} />
                                                    <button type="submit" className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors" title="Eliminar">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {mergedTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-secondary">
                                            No hay movimientos registrados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Download ZIP Card */}
                <div className="glass-panel p-6 border-t-2 border-t-blue-400">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Download size={20} className="text-blue-400" />
                        Exportar Comprobantes
                    </h2>
                    <p className="text-sm text-secondary mb-4">
                        Descarga un archivo ZIP con todos los comprobantes de tus ingresos.
                    </p>

                    <form method="GET" action="/api/export-receipts" className="space-y-4">
                        {isAdmin && (
                            <div>
                                <label htmlFor="userId" className="label text-xs">Cliente a Exportar</label>
                                <select name="userId" id="userId" className="input-field py-2 text-sm bg-black/20 text-white border-white/10" defaultValue="all">
                                    <option value="all">Todos los comprobantes (Mezclados)</option>
                                    {allProfiles?.filter(p => p.role === 'user').map(p => (
                                        <option key={p.id} value={p.id}>{p.business_name || `Cliente ${p.id.split('-')[0]}`}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label htmlFor="start" className="label text-xs">Fecha Inicio</label>
                            <input type="date" id="start" name="start" required className="input-field text-sm py-2" defaultValue={startOfMonth.split('T')[0]} />
                        </div>
                        <div>
                            <label htmlFor="end" className="label text-xs">Fecha Fin</label>
                            <input type="date" id="end" name="end" required className="input-field text-sm py-2" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="flex flex-col gap-2 pt-2">
                            <button type="submit" className="btn-primary py-2 text-sm w-full flex items-center justify-center gap-2">
                                <Download size={16} /> Descargar Archivo ZIP
                            </button>
                            <a href={`/api/export-receipts?start=${now.toISOString().split('T')[0]}&end=${now.toISOString().split('T')[0]}${isAdmin ? '&userId=all' : ''}`} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg py-2 text-sm w-full flex items-center justify-center gap-2 transition-colors">
                                <Download size={16} /> Exportar comprobantes de hoy
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
