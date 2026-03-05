import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { updateCommissionAction } from './actions'
import { PercentCircle, Users, Activity } from 'lucide-react'

export default async function AdminPanelPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Verify Admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return (
            <div className="p-8 text-center text-red-500 glass-panel animate-fade-in">
                <h2 className="text-xl font-bold">Acceso Denegado</h2>
                <p>Solamente los administradores pueden ver esta página.</p>
            </div>
        )
    }

    // Fetch all users/profiles
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
      id,
      role,
      commission_percentage,
      created_at
    `)
        .order('created_at', { ascending: false })

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                    Panel de Administrador
                </h1>
                <p className="text-secondary mt-2">Gestiona clientes, reglas y comisiones de la plataforma</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <div className="glass-card p-6 border-t-4 border-t-blue-500">
                    <Users className="text-blue-500 mb-2" size={32} />
                    <p className="text-secondary font-medium">Usuarios Registrados</p>
                    <h3 className="text-3xl font-bold text-white">{profiles?.filter(p => p.role === 'user').length}</h3>
                </div>
                <div className="glass-card p-6 border-t-4 border-t-indigo-500">
                    <PercentCircle className="text-indigo-500 mb-2" size={32} />
                    <p className="text-secondary font-medium">Administradores</p>
                    <h3 className="text-3xl font-bold text-white">{profiles?.filter(p => p.role === 'admin').length}</h3>
                </div>
                <div className="glass-card p-6 border-t-4 border-t-emerald-500 flex items-center justify-between">
                    <div>
                        <Activity className="text-emerald-500 mb-2" size={32} />
                        <p className="text-secondary font-medium">Estado del Sistema</p>
                        <h3 className="text-xl font-bold text-emerald-400">Operativo</h3>
                    </div>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
                    <h2 className="text-xl font-bold">Base de Usuarios</h2>
                    {/* Aquí iría el modal de Crear Usuario, pero para eso se requiere la Service Role Key */}
                    <button className="btn-secondary w-auto text-sm px-4 py-2 opacity-50 cursor-not-allowed hidden" disabled>
                        Crear Usuario
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20 text-secondary text-sm">
                                <th className="px-6 py-4 font-medium">ID Usuario (UUID)</th>
                                <th className="px-6 py-4 font-medium">Rol</th>
                                <th className="px-6 py-4 font-medium">Comisión Actual</th>
                                <th className="px-6 py-4 font-medium text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles?.map((p) => (
                                <tr key={p.id} className="border-b border-[var(--border-color)] hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{p.id}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${p.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                            {p.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <form action={updateCommissionAction} className="flex items-center gap-2">
                                            <input type="hidden" name="userId" value={p.id} />
                                            <input
                                                type="number"
                                                name="commission"
                                                defaultValue={p.commission_percentage}
                                                className="input-field w-24 py-1 px-2 text-sm"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="text-secondary">%</span>
                                            <button type="submit" className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded hover:bg-emerald-500/40 transition-colors">
                                                Guardar
                                            </button>
                                        </form>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a href={`/dashboard/admin/user/${p.id}`} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                            Ver Movimientos &rarr;
                                        </a>
                                    </td>
                                </tr>
                            ))}

                            {(!profiles || profiles.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-secondary">
                                        No hay usuarios registrados
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
