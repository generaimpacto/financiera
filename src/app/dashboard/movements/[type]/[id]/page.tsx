import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, DollarSign, User, FileImage, Building2 } from 'lucide-react'

function formatCurrency(n: number) {
    return '$ ' + Math.round(n).toLocaleString('es-AR')
}

export default async function MovementDetailPage({ params }: { params: Promise<{ type: string; id: string }> }) {
    const { type, id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin'

    if (type === 'payment') {
        const { data: payment } = await supabase
            .from('payments')
            .select('*')
            .eq('id', id)
            .single()

        if (!payment) redirect('/dashboard/movements')

        // Get owner name
        let ownerName = ''
        if (isAdmin) {
            const { data: ownerProfile } = await supabase.from('profiles').select('business_name').eq('id', payment.user_id).single()
            ownerName = ownerProfile?.business_name || `Cliente ${payment.user_id.split('-')[0]}`
        }

        return (
            <div className="animate-fade-in max-w-2xl mx-auto">
                <Link href="/dashboard/movements" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-white transition-colors mb-6">
                    <ArrowLeft size={16} /> Volver a Movimientos
                </Link>

                <div className="glass-panel overflow-hidden">
                    <div className="p-6 border-b border-[var(--border-color)] bg-emerald-500/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">Ingreso</span>
                                <h1 className="text-2xl font-bold text-white mt-3">{formatCurrency(payment.amount)}</h1>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        {isAdmin && ownerName && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg"><Building2 size={18} className="text-blue-400" /></div>
                                <div>
                                    <p className="text-xs text-secondary">Cliente</p>
                                    <p className="text-white font-medium">{ownerName}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg"><User size={18} className="text-gray-400" /></div>
                            <div>
                                <p className="text-xs text-secondary">Nombre del pagador</p>
                                <p className="text-white font-medium">{payment.client_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg"><Calendar size={18} className="text-gray-400" /></div>
                            <div>
                                <p className="text-xs text-secondary">Fecha</p>
                                <p className="text-white font-medium">{payment.payment_date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg"><DollarSign size={18} className="text-gray-400" /></div>
                            <div>
                                <p className="text-xs text-secondary">Monto</p>
                                <p className="text-emerald-400 font-bold text-lg">{formatCurrency(payment.amount)}</p>
                            </div>
                        </div>

                        {/* Receipt Image Preview */}
                        {payment.receipt_url && (
                            <div className="pt-4 border-t border-[var(--border-color)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileImage size={18} className="text-secondary" />
                                    <h3 className="font-bold text-white">Comprobante</h3>
                                </div>
                                <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="block">
                                    <div className="rounded-lg overflow-hidden border border-[var(--border-color)] hover:border-blue-500/50 transition-colors cursor-pointer">
                                        <img
                                            src={payment.receipt_url}
                                            alt="Comprobante de pago"
                                            className="w-full max-h-[500px] object-contain bg-black/30"
                                        />
                                    </div>
                                    <p className="text-xs text-blue-400 mt-2 text-center">Clic para abrir en tamaño completo</p>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Expense detail
    const { data: expense } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single()

    if (!expense) redirect('/dashboard/movements')

    let ownerName = ''
    if (isAdmin) {
        const { data: ownerProfile } = await supabase.from('profiles').select('business_name').eq('id', expense.user_id).single()
        ownerName = ownerProfile?.business_name || `Cliente ${expense.user_id.split('-')[0]}`
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <Link href="/dashboard/movements" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-white transition-colors mb-6">
                <ArrowLeft size={16} /> Volver a Movimientos
            </Link>

            <div className="glass-panel overflow-hidden">
                <div className="p-6 border-b border-[var(--border-color)] bg-red-500/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="bg-red-500/10 text-red-400 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">Egreso</span>
                            <h1 className="text-2xl font-bold text-white mt-3">{formatCurrency(expense.amount)}</h1>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {isAdmin && ownerName && (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg"><Building2 size={18} className="text-blue-400" /></div>
                            <div>
                                <p className="text-xs text-secondary">Cliente</p>
                                <p className="text-white font-medium">{ownerName}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg"><User size={18} className="text-gray-400" /></div>
                        <div>
                            <p className="text-xs text-secondary">Descripción</p>
                            <p className="text-white font-medium">{expense.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg"><Calendar size={18} className="text-gray-400" /></div>
                        <div>
                            <p className="text-xs text-secondary">Fecha</p>
                            <p className="text-white font-medium">{expense.expense_date}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg"><DollarSign size={18} className="text-gray-400" /></div>
                        <div>
                            <p className="text-xs text-secondary">Monto</p>
                            <p className="text-red-400 font-bold text-lg">-{formatCurrency(expense.amount)}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--border-color)]">
                        <p className="text-xs text-secondary italic">Los egresos no tienen comprobante adjunto.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
