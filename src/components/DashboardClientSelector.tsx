'use client'

import { useRouter } from 'next/navigation'

interface Client {
    id: string
    business_name: string | null
}

export function DashboardClientSelector({ clients, activeClientId }: { clients: Client[], activeClientId: string }) {
    const router = useRouter()
    
    return (
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
            <span className="text-xs text-secondary font-medium">Cliente:</span>
            <select
                value={activeClientId}
                onChange={(e) => {
                    router.push(`/dashboard?clientId=${e.target.value}`)
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
