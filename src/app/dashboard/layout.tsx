import { ReactNode } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Receipt, TrendingDown, Settings, LogOut, UserCog, List } from 'lucide-react'
import { signOutAction } from '@/app/auth/actions'
import { createClient } from '@/utils/supabase/server'
import { ClientSwitcher } from '@/components/ClientSwitcher'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch user role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    // Fetch client list for admin switcher
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
        <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
            {/* Sidebar background decoration */}
            <div className="absolute top-0 left-0 w-64 h-full bg-blue-900 rounded-r-full mix-blend-multiply filter blur-[150px] opacity-10 pointer-events-none"></div>

            {/* Sidebar */}
            <aside className="w-64 glass-panel border-y-0 border-l-0 rounded-none flex flex-col relative z-10">
                <div className="p-6">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Finanzas Pro
                    </h2>
                    <p className="text-sm text-secondary mt-1">{user?.email}</p>
                    {isAdmin && (
                        <span className="inline-block mt-2 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-md border border-emerald-500/20">
                            Administrador
                        </span>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {isAdmin && clients.length > 0 && (
                        <ClientSwitcher clients={clients} />
                    )}
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white">
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Resumen</span>
                    </Link>
                    <Link href="/dashboard/movements" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white">
                        <List size={20} />
                        <span className="font-medium">Movimientos</span>
                    </Link>
                    <Link href="/dashboard/payments/new" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white">
                        <Receipt size={20} />
                        <span className="font-medium">Nuevo Ingreso</span>
                    </Link>
                    <Link href="/dashboard/expenses/new" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white">
                        <TrendingDown size={20} />
                        <span className="font-medium">Nuevo Egreso</span>
                    </Link>

                    <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white mt-4">
                        <UserCog size={20} />
                        <span className="font-medium">Mi Perfil</span>
                    </Link>

                    {isAdmin && (
                        <Link href="/dashboard/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white mt-2">
                            <Settings size={20} />
                            <span className="font-medium">Panel Admin</span>
                        </Link>
                    )}
                </nav>

                <div className="p-4 border-t border-[var(--border-color)]">
                    <form action={signOutAction}>
                        <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                            <LogOut size={20} />
                            <span className="font-medium">Cerrar Sesión</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative z-0 p-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
