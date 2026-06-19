'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Client {
    id: string
    business_name: string | null
}

export function DashboardClientSelector({ clients, activeClientId }: { clients: Client[], activeClientId: string }) {
    const router = useRouter()
    const params = useSearchParams()

    return (
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
            <span className="text-xs text-secondary font-medium">Cliente:</span>
            <select
                value={activeClientId}
                onChange={(e) => {
                    const p = new URLSearchParams(params.toString())
                    p.set('clientId', e.target.value)
                    router.push(`/dashboard?${p.toString()}`)
                }}
                className="bg-transparent text-sm text-white font-medium focus:outline-none cursor-pointer"
            >
                {clients.map(c => (
                    <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                        {c.business_name || `Cliente ${c.id.split('-')[0]}`}
                    </option>
                ))}
                <option value="all" className="bg-gray-900 text-white">Consolidado (Todos)</option>
            </select>
        </div>
    )
}
