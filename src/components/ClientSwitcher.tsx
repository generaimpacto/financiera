'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Users } from 'lucide-react'
import { setViewClientAction } from '@/app/dashboard/viewClientActions'

interface Client {
    id: string
    business_name: string | null
}

export function ClientSwitcher({
    clients,
    currentClientId,
}: {
    clients: Client[]
    currentClientId: string
}) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const val = e.target.value
        startTransition(async () => {
            await setViewClientAction(val)
            router.refresh()
        })
    }

    return (
        <div className="px-4 mb-4">
            <label className="flex items-center gap-2 text-xs text-secondary font-medium mb-1.5 px-1">
                <Users size={12} />
                Ver como cliente
            </label>
            <select
                value={currentClientId}
                onChange={handleChange}
                disabled={pending}
                className={`w-full bg-black/30 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer appearance-none disabled:opacity-60 ${
                    currentClientId ? 'border-blue-500/50' : 'border-white/10'
                }`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239ca3af' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
                <option value="">— Mi Dashboard (Admin) —</option>
                {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.business_name || `Cliente ${c.id.split('-')[0]}`}
                    </option>
                ))}
            </select>
        </div>
    )
}
