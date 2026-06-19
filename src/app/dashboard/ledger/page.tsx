import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight, Plus, Eye, TrendingUp, TrendingDown, Scale } from 'lucide-react'
import { DeleteMovementButton } from './DeleteMovementButton'
import { getViewClientId } from '@/lib/viewClient'

function fmt(n: number) {
    return '$ ' + Math.round(n).toLocaleString('es-AR')
}
function cap(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

type Movement = {
    id: string
    type: 'income' | 'expense'
    amount: number
    movement_date: string
    origin: string | null
    scope: 'agency' | 'client'
    client_id: string | null
    client_name: string | null
    concept: string | null
    payment_method: string
    notes: string | null
    receipt_url: string | null
    created_by: string
}

export default async function LedgerPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin'

    let nameMap = new Map<string, string>()
    if (isAdmin) {
        const { data: allProfiles } = await supabase.from('profiles').select('id, business_name')
        nameMap = new Map(allProfiles?.map((p) => [p.id, p.business_name || `Cliente ${p.id.split('-')[0]}`]) || [])
    }

    // "Ver como cliente": si hay un cliente seleccionado, filtramos a sus movimientos.
    const viewClientId = isAdmin ? await getViewClientId() : ''
    const viewClientName = viewClientId ? nameMap.get(viewClientId) || 'cliente' : ''

    const filterType = params.type === 'income' || params.type === 'expense' ? params.type : null

    let query = supabase
        .from('movements')
        .select('*')
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false })
    if (filterType) query = query.eq('type', filterType)
    if (viewClientId) query = query.eq('client_id', viewClientId)

    const { data } = await query
    const movements = (data || []) as Movement[]

    const ingresos = movements.filter((m) => m.type === 'income').reduce((s, m) => s + Number(m.amount), 0)
    const egresos = movements.filter((m) => m.type === 'expense').reduce((s, m) => s + Number(m.amount), 0)
    const neto = ingresos - egresos

    const stats = [
        { label: 'Ingresos', value: ingresos, border: 'border-t-emerald-500', text: 'text-emerald-400', Icon: TrendingUp },
        { label: 'Egresos', value: egresos, border: 'border-t-red-500', text: 'text-red-400', Icon: TrendingDown },
        { label: 'Neto', value: neto, border: 'border-t-blue-500', text: 'text-blue-400', Icon: Scale },
    ]

    return (
        <div className="animate-fade-in max-w-6xl mx-auto">
            <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Movimientos
                    </h1>
                    <p className="text-secondary mt-2">
                        {viewClientName
                            ? `Movimientos de ${viewClientName} — ${movements.length} registros`
                            : `Ingresos y egresos de la agencia y los clientes — ${movements.length} registros`}
                    </p>
                </div>
                <Link href="/dashboard/ledger/new" className="btn-primary flex items-center gap-2">
                    <Plus size={18} aria-hidden="true" /> Nuevo movimiento
                </Link>
            </header>

            {/* Totales */}
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
                {stats.map((s) => (
                    <div key={s.label} className={`glass-card border-t-4 p-5 ${s.border}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-secondary text-sm">{s.label}</span>
                            <s.Icon size={18} className={s.text} aria-hidden="true" />
                        </div>
                        <div className={`mt-2 text-2xl font-bold ${s.text}`}>{fmt(s.value)}</div>
                    </div>
                ))}
            </div>

            {/* Filtro por tipo */}
            <div className="mb-4 flex gap-2 text-sm">
                <Link href="/dashboard/ledger" className={`px-3 py-1.5 rounded-lg ${!filterType ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>Todos</Link>
                <Link href="/dashboard/ledger?type=income" className={`px-3 py-1.5 rounded-lg ${filterType === 'income' ? 'bg-emerald-500/15 text-emerald-300' : 'text-gray-400 hover:bg-white/5'}`}>Ingresos</Link>
                <Link href="/dashboard/ledger?type=expense" className={`px-3 py-1.5 rounded-lg ${filterType === 'expense' ? 'bg-red-500/15 text-red-300' : 'text-gray-400 hover:bg-white/5'}`}>Egresos</Link>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20 text-secondary text-sm">
                                <th className="px-4 py-3 font-medium">Fecha</th>
                                <th className="px-4 py-3 font-medium">Cliente / Origen</th>
                                <th className="px-4 py-3 font-medium">Concepto</th>
                                <th className="px-4 py-3 font-medium">Método</th>
                                <th className="px-4 py-3 font-medium text-right">Monto</th>
                                {isAdmin && <th className="px-4 py-3 font-medium">Cargó</th>}
                                <th className="px-4 py-3 font-medium text-right"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.map((m) => (
                                <tr key={m.id} className="border-b border-[var(--border-color)] hover:bg-white/5 transition-colors text-sm">
                                    <td className="px-4 py-3.5 text-gray-300 whitespace-nowrap">{m.movement_date}</td>
                                    <td className="px-4 py-3.5">
                                        <span className="text-white font-medium">
                                            {m.scope === 'client' ? m.client_name || 'Cliente' : 'Agencia'}
                                        </span>
                                        {m.origin && <span className="block text-xs text-secondary">{m.origin}</span>}
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-300">{m.concept || '—'}</td>
                                    <td className="px-4 py-3.5 text-gray-400 text-xs">{cap(m.payment_method)}</td>
                                    <td className={`px-4 py-3.5 text-right font-bold whitespace-nowrap ${m.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        <span className="inline-flex items-center gap-1">
                                            {m.type === 'income' ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />}
                                            {m.type === 'income' ? '+' : '-'}{fmt(Number(m.amount))}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-4 py-3.5 text-blue-300 text-xs">{nameMap.get(m.created_by) || '—'}</td>
                                    )}
                                    <td className="px-4 py-3.5 text-right">
                                        <div className="flex justify-end gap-2">
                                            {m.receipt_url && (
                                                <a href={m.receipt_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:bg-white/10 rounded transition-colors" title="Ver comprobante">
                                                    <Eye size={16} aria-hidden="true" />
                                                </a>
                                            )}
                                            {isAdmin && <DeleteMovementButton id={m.id} />}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {movements.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 7 : 6} className="px-5 py-12 text-center text-secondary">
                                        No hay movimientos todavía. Cargá el primero con “Nuevo movimiento”.
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
