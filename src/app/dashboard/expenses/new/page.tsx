import { createClient } from '@/utils/supabase/server'
import { addExpenseAction } from './actions'
import { Users } from 'lucide-react'

export default async function NewExpensePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check admin and get clients list
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    let clients: { id: string; business_name: string | null }[] = []
    if (isAdmin) {
        const { data } = await supabase
            .from('profiles')
            .select('id, business_name')
            .eq('role', 'user')
            .order('business_name', { ascending: true })
        clients = data || []
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
                    Registrar Egreso
                </h1>
                <p className="text-secondary mt-2">Añade un nuevo gasto{isAdmin ? ' a la cuenta de un cliente' : ' a tu cuenta'}</p>
            </header>

            <div className="glass-panel p-8">
                <form action={addExpenseAction} className="space-y-6">
                    {/* Admin: Client Selector */}
                    {isAdmin && clients.length > 0 && (
                        <div className="bg-indigo-500/5 border border-indigo-500/30 rounded-lg p-4">
                            <label htmlFor="targetUserId" className="label flex items-center gap-2 text-indigo-300">
                                <Users size={16} />
                                Asignar a Cliente
                            </label>
                            <select
                                id="targetUserId"
                                name="targetUserId"
                                className="input-field bg-black/30 text-white border-indigo-500/30 mt-1"
                                required
                            >
                                <option value="">— Seleccionar cliente —</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.business_name || `Cliente ${c.id.split('-')[0]}`}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-indigo-300/60 mt-1">Como admin, este egreso se cargará en la cuenta del cliente seleccionado.</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="description" className="label">Descripción del Gasto</label>
                        <input
                            id="description"
                            name="description"
                            type="text"
                            required
                            placeholder="Ej. Pago de servicios, Proveedor X..."
                            className="input-field"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="amount" className="label">Monto (ARS)</label>
                            <input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                placeholder="0.00"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label htmlFor="date" className="label">Fecha</label>
                            <input
                                id="date"
                                name="date"
                                type="date"
                                required
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="input-field"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--border-color)]">
                        <button type="submit" className="btn-primary">
                            Guardar Egreso
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
