'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Calendar, X } from 'lucide-react'

function arToday(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
}

export function DateRangeFilter() {
    const router = useRouter()
    const pathname = usePathname()
    const params = useSearchParams()
    const desde = params.get('desde') || ''
    const hasta = params.get('hasta') || ''

    function apply(next: { desde?: string; hasta?: string }) {
        const p = new URLSearchParams(params.toString())
        if (next.desde !== undefined) next.desde ? p.set('desde', next.desde) : p.delete('desde')
        if (next.hasta !== undefined) next.hasta ? p.set('hasta', next.hasta) : p.delete('hasta')
        p.delete('page') // reset paginación
        const qs = p.toString()
        router.push(qs ? `${pathname}?${qs}` : pathname)
    }

    function presetMes() {
        const [y, m] = arToday().split('-').map(Number)
        apply({ desde: `${y}-${String(m).padStart(2, '0')}-01`, hasta: arToday() })
    }

    function presetMesPasado() {
        const [y, m] = arToday().split('-').map(Number)
        const pm = m === 1 ? 12 : m - 1
        const py = m === 1 ? y - 1 : y
        const lastDay = new Date(py, pm, 0).getDate()
        apply({
            desde: `${py}-${String(pm).padStart(2, '0')}-01`,
            hasta: `${py}-${String(pm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
        })
    }

    const active = desde || hasta
    const presetBtn = 'px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-xs'
    const dateInput = 'rounded-lg bg-black/30 border border-white/10 text-white text-sm px-2 py-1.5 focus:outline-none focus:border-blue-500/50'

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Calendar size={16} className="text-secondary" aria-hidden="true" />
            <button type="button" onClick={presetMes} className={presetBtn}>Este mes</button>
            <button type="button" onClick={presetMesPasado} className={presetBtn}>Mes pasado</button>
            <input
                type="date"
                value={desde}
                max={hasta || undefined}
                onChange={(e) => apply({ desde: e.target.value })}
                className={dateInput}
                aria-label="Desde"
            />
            <span className="text-secondary text-xs">a</span>
            <input
                type="date"
                value={hasta}
                min={desde || undefined}
                onChange={(e) => apply({ hasta: e.target.value })}
                className={dateInput}
                aria-label="Hasta"
            />
            {active && (
                <button
                    type="button"
                    onClick={() => apply({ desde: '', hasta: '' })}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-secondary hover:text-white hover:bg-white/5 transition-colors"
                    title="Limpiar filtro de fechas"
                >
                    <X size={13} /> Limpiar
                </button>
            )}
        </div>
    )
}
