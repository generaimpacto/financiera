import { createClient } from '@/utils/supabase/server'
import { Wallet, TrendingUp, TrendingDown, PercentCircle, Download, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { deleteTransactionAction } from '@/app/dashboard/actions'
import { RevenueChart } from '@/components/RevenueChart'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminUserDashboardPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const targetUserId = params.id

    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) redirect('/login')

    // Verify Admin
    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single()
    if (adminProfile?.role !== 'admin') redirect('/dashboard')

    // Date calculations for current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // 1. Fetch Target Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, commission_percentage, business_name')
        .eq('id', targetUserId)
        .single()

    if (!profile) return <div className="p-8">Usuario no encontrado.</div>

    const commissionPercentage = profile?.commission_percentage || 0
    const businessName = profile?.business_name || 'Sin Nombre'

    // 2. Fetch ALL Payments (Income) for Target User
    const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, payment_date, client_name')
        .eq('user_id', targetUserId)
        .order('payment_date', { ascending: false })

    // 3. Fetch ALL Expenses for Target User
    const { data: expenses } = await supabase
        .from('expenses')
        .select('id, amount, expense_date, description')
        .eq('user_id', targetUserId)

    const totalIncome = payments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
    const totalExpenses = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    // Combine and sort transactions
    const mergedTransactions = [
        ...(payments || []).map(p => ({
            id: p.id,
            date: p.payment_date,
            description: p.client_name,
            amount: Number(p.amount),
            type: 'income'
        })),
        ...(expenses || []).map(e => ({
            id: e.id,
            date: e.expense_date,
            description: e.description,
            amount: Number(e.amount),
            type: 'expense'
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 4. Calculations base on User point of view
    const commissionToPay = (totalIncome * commissionPercentage) / 100
    const balance = totalIncome - totalExpenses - commissionToPay

    // 5. Fetch 6-months Data for Chart
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()
    const { data: historicalPayments } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .eq('user_id', targetUserId)
        .gte('payment_date', sixMonthsAgo)
        .order('payment_date', { ascending: true })

    const monthlyData = new Map<string, number>()

    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(d).toUpperCase()
        monthlyData.set(monthName, 0)
    }

    // Aggregate real data
    historicalPayments?.forEach(p => {
        const d = new Date(p.payment_date)
        const monthName = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(d).toUpperCase()
        if (monthlyData.has(monthName)) {
            monthlyData.set(monthName, monthlyData.get(monthName)! + Number(p.amount))
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

    return (
        <div className="animate-fade-in">
            <Link href="/dashboard/admin" className="inline-flex items-center text-secondary hover:text-white transition-colors mb-6 text-sm">
                <ArrowLeft className="mr-2" size={16} /> Volver al Panel de Admin
            </Link>

            <header className="mb-8 p-6 glass-card border-l-4 border-l-blue-500">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Dashboard: <span className="text-blue-400">{businessName}</span>
                </h1>
                <p className="text-secondary text-sm">
                    Estás viendo la información financiera de este cliente como Administrador. Puedes editar y eliminar registros de este cliente sin restricciones.
                </p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Income Card */}
                <div className="glass-card p-6 border-t-4 border-t-emerald-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp size={64} className="text-emerald-500" />
                    </div>
                    <p className="text-secondary font-medium mb-1 relative z-10">Ingresos (Total)</p>
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
                    <p className="text-secondary font-medium mb-1 relative z-10">Balance Neto</p>
                    <h3 className="text-3xl font-bold text-white relative z-10">{formatCurrency(balance)}</h3>
                </div>

                {/* Commission Card */}
                <div className="glass-card p-6 border-t-4 border-t-purple-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <PercentCircle size={64} className="text-purple-500" />
                    </div>
                    <div className="flex justify-between items-center mb-1 relative z-10">
                        <p className="text-secondary font-medium">Comisión a Pagar</p>
                        <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded font-bold">
                            {commissionPercentage}%
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white relative z-10">{formatCurrency(commissionToPay)}</h3>
                </div>
            </div>

            {/* Revenue Growth Chart */}
            <div className="mb-6">
                <RevenueChart data={chartData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <div className="glass-panel p-8 lg:col-span-2">
                    <h2 className="text-xl font-bold mb-6">Últimos Movimientos del Cliente</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 text-secondary text-sm">
                                    <th className="px-4 py-3 font-medium">Fecha</th>
                                    <th className="px-4 py-3 font-medium">Descripción</th>
                                    <th className="px-4 py-3 font-medium">Monto</th>
                                    <th className="px-4 py-3 font-medium">Tipo</th>
                                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mergedTransactions.slice(0, 10).map((t, i) => (
                                    <tr key={i} className="border-b border-[var(--border-color)] text-sm group">
                                        <td className="px-4 py-3">{t.date}</td>
                                        <td className="px-4 py-3 text-gray-300">{t.description}</td>
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
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={t.type === 'income' ? `/dashboard/payments/${t.id}/edit` : `/dashboard/expenses/${t.id}/edit`} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors" title="Editar">
                                                    <Pencil size={16} />
                                                </Link>
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
                                        <td colSpan={5} className="px-4 py-8 text-center text-secondary">
                                            No hay movimientos registrados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Download ZIP Card for target user */}
                <div className="glass-panel p-6 border-t-2 border-t-blue-400">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Download size={20} className="text-blue-400" />
                        Exportar Comprobantes de Cliente
                    </h2>
                    <p className="text-sm text-secondary mb-4">
                        Descarga un archivo ZIP especifico de {businessName}.
                    </p>

                    <form method="GET" action="/api/export-receipts" className="space-y-4">
                        <input type="hidden" name="userId" value={targetUserId} />
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
                            <a href={`/api/export-receipts?start=${now.toISOString().split('T')[0]}&end=${now.toISOString().split('T')[0]}&userId=${targetUserId}`} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg py-2 text-sm w-full flex items-center justify-center gap-2 transition-colors">
                                <Download size={16} /> Exportar comprobantes de hoy
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
