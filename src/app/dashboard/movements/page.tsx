import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight, Eye, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { deleteTransactionAction } from '@/app/dashboard/actions'
import { getViewClientId } from '@/lib/viewClient'
import { getSession } from '@/lib/session'

function formatCurrency(n: number) {
    return '$ ' + Math.round(n).toLocaleString('es-AR')
}

export default async function MovementsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const params = await searchParams
    const supabase = await createClient()
    const { user, profile } = await getSession()
    if (!user) redirect('/login')
    const isAdmin = profile?.role === 'admin'

    // Build name map for admin
    let nameMap = new Map<string, string>()
    if (isAdmin) {
        const { data: allProfiles } = await supabase.from('profiles').select('id, business_name')
        nameMap = new Map(allProfiles?.map(p => [p.id, p.business_name || `Cliente ${p.id.split('-')[0]}`]) || [])
    }

    // "Ver como cliente": filtrar a ese cliente si está seleccionado.
    const viewClientId = isAdmin ? await getViewClientId() : ''

    // Fetch payments
    let pq = supabase
        .from('payments')
        .select('id, amount, payment_date, client_name, user_id, receipt_url')
        .order('payment_date', { ascending: false })
    if (viewClientId) pq = pq.eq('user_id', viewClientId)
    const { data: payments } = await pq

    // Fetch expenses
    let eq = supabase
        .from('expenses')
        .select('id, amount, expense_date, description, user_id, receipt_url')
        .order('expense_date', { ascending: false })
    if (viewClientId) eq = eq.eq('user_id', viewClientId)
    const { data: expenses } = await eq

    // Merge and sort
    const all = [
        ...(payments || []).map(p => ({
            id: p.id, date: p.payment_date, description: p.client_name,
            amount: Number(p.amount), type: 'payment' as const,
            ownerName: nameMap.get(p.user_id) || '', hasReceipt: !!p.receipt_url
        })),
        ...(expenses || []).map(e => ({
            id: e.id, date: e.expense_date, description: e.description,
            amount: Number(e.amount), type: 'expense' as const,
            ownerName: nameMap.get(e.user_id) || '', hasReceipt: !!e.receipt_url
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Pagination
    const perPage = 20
    const page = Math.max(1, parseInt(params.page || '1'))
    const totalPages = Math.ceil(all.length / perPage)
    const paginated = all.slice((page - 1) * perPage, page * perPage)

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Comprobantes
                </h1>
                <p className="text-secondary mt-2">Pagos y egresos con comprobante — {all.length} registros</p>
            </header>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20 text-secondary text-sm">
                                <th className="px-5 py-3 font-medium">Fecha</th>
                                {isAdmin && <th className="px-5 py-3 font-medium">Cliente</th>}
                                <th className="px-5 py-3 font-medium">Descripción</th>
                                <th className="px-5 py-3 font-medium">Monto</th>
                                <th className="px-5 py-3 font-medium">Tipo</th>
                                <th className="px-5 py-3 font-medium text-right">Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((t) => (
                                <tr key={`${t.type}-${t.id}`} className="border-b border-[var(--border-color)] hover:bg-white/5 transition-colors text-sm">
                                    <td className="px-5 py-3.5 text-gray-300">{t.date}</td>
                                    {isAdmin && <td className="px-5 py-3.5 text-blue-300 text-xs font-medium">{t.ownerName}</td>}
                                    <td className="px-5 py-3.5 text-white font-medium">{t.description}</td>
                                    <td className={`px-5 py-3.5 font-bold ${t.type === 'payment' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        <span className="flex items-center gap-1">
                                            {t.type === 'payment' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                            {t.type === 'payment' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {t.type === 'payment' ? (
                                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-medium">Pago</span>
                                        ) : (
                                            <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs font-medium">Egreso</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/dashboard/movements/${t.type}/${t.id}`}
                                                className="p-1.5 text-gray-400 hover:bg-white/10 rounded transition-colors"
                                                title="Ver detalle"
                                            >
                                                <Eye size={16} />
                                            </Link>
                                            <a
                                                href={t.type === 'payment' ? `/dashboard/payments/${t.id}/edit` : `/dashboard/expenses/${t.id}/edit`}
                                                className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </a>
                                            <form action={deleteTransactionAction}>
                                                <input type="hidden" name="id" value={t.id} />
                                                <input type="hidden" name="type" value={t.type === 'payment' ? 'income' : 'expense'} />
                                                <button type="submit" className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors" title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {all.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center text-secondary">
                                        No hay movimientos registrados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-[var(--border-color)]">
                        <p className="text-xs text-secondary">Página {page} de {totalPages}</p>
                        <div className="flex gap-2">
                            {page > 1 && (
                                <Link
                                    href={`/dashboard/movements?page=${page - 1}`}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300"
                                >
                                    <ChevronLeft size={14} /> Anterior
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={`/dashboard/movements?page=${page + 1}`}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300"
                                >
                                    Siguiente <ChevronRight size={14} />
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
