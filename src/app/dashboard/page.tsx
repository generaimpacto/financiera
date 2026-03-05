import { createClient } from '@/utils/supabase/server'
import { Wallet, TrendingUp, TrendingDown, PercentCircle, Download, Receipt } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Date calculations for current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // 1. Fetch Profile (for commission percentage)
    const { data: profile } = await supabase
        .from('profiles')
        .select('commission_percentage')
        .eq('id', user?.id)
        .single()

    const commissionPercentage = profile?.commission_percentage || 0

    // 2. Fetch Payments (Income) this month
    const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_date, client_name')
        .gte('payment_date', startOfMonth)
        .order('payment_date', { ascending: false })

    const totalIncome = payments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    // 3. Fetch Expenses this month
    const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', startOfMonth)

    const totalExpenses = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    // 4. Calculations
    const balance = totalIncome - totalExpenses
    const commissionToPay = (totalIncome * commissionPercentage) / 100

    // Formatter plugin
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val)

    return (
        <div className="animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Resumen del Mes
                </h1>
                <p className="text-secondary mt-2">Visión global de tus finanzas en <b>{new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(now)}</b></p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Income Card */}
                <div className="glass-card p-6 border-t-4 border-t-emerald-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp size={64} className="text-emerald-500" />
                    </div>
                    <p className="text-secondary font-medium mb-1 relative z-10">Ingresos (Mes)</p>
                    <h3 className="text-3xl font-bold text-white relative z-10">{formatCurrency(totalIncome)}</h3>
                </div>

                {/* Expenses Card */}
                <div className="glass-card p-6 border-t-4 border-t-red-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingDown size={64} className="text-red-500" />
                    </div>
                    <p className="text-secondary font-medium mb-1 relative z-10">Egresos (Mes)</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Transactions placeholder */}
                <div className="glass-panel p-8 lg:col-span-2">
                    <h2 className="text-xl font-bold mb-6">Últimos Movimientos</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 text-secondary text-sm">
                                    <th className="px-4 py-3 font-medium">Fecha</th>
                                    <th className="px-4 py-3 font-medium">Cliente</th>
                                    <th className="px-4 py-3 font-medium">Monto</th>
                                    <th className="px-4 py-3 font-medium text-right">Tipo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments?.slice(0, 5).map((p, i) => (
                                    <tr key={i} className="border-b border-[var(--border-color)] text-sm">
                                        <td className="px-4 py-3">{p.payment_date}</td>
                                        <td className="px-4 py-3 text-gray-300">{p.client_name}</td>
                                        <td className="px-4 py-3 font-bold text-emerald-400">{formatCurrency(p.amount)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs">Pago</span>
                                        </td>
                                    </tr>
                                ))}
                                {(!payments || payments.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-secondary">
                                            No hay pagos registrados
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
                        <div>
                            <label htmlFor="start" className="label text-xs">Fecha Inicio</label>
                            <input type="date" id="start" name="start" required className="input-field text-sm py-2" defaultValue={startOfMonth.split('T')[0]} />
                        </div>
                        <div>
                            <label htmlFor="end" className="label text-xs">Fecha Fin</label>
                            <input type="date" id="end" name="end" required className="input-field text-sm py-2" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <button type="submit" className="btn-primary py-2 text-sm w-full flex items-center justify-center gap-2">
                            <Download size={16} /> Descargar Archivo ZIP
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
