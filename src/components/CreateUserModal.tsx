'use client'

import { useState } from 'react'
import { Plus, X, Building2, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { adminCreateUserAction } from '@/app/dashboard/admin/actions'

export function CreateUserModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setMessage(null)

        const result = await adminCreateUserAction(null, formData)

        if (result?.error) {
            setMessage({ text: String(result.error), type: 'error' })
        } else if (result?.success) {
            setMessage({ text: String(result.message), type: 'success' })
            setTimeout(() => {
                setIsOpen(false)
                setMessage(null)
            }, 2000)
        }

        setIsLoading(false)
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn-primary w-auto text-sm px-4 py-2 flex items-center justify-center gap-2"
            >
                <Plus size={16} /> Crear Usuario
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="glass-panel w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-secondary hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-xl font-bold mb-6">Crear Nuevo Cliente</h2>

                        {message && (
                            <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/50' : 'bg-emerald-500/10 border-emerald-500/50'}`}>
                                {message.type === 'error' ? (
                                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                                ) : (
                                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                                )}
                                <p className={`text-sm ${message.type === 'error' ? 'text-red-200' : 'text-emerald-200'}`}>
                                    {message.text}
                                </p>
                            </div>
                        )}

                        <form action={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="businessName" className="label text-sm">Nombre del Negocio</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                                        <Building2 size={16} />
                                    </div>
                                    <input type="text" id="businessName" name="businessName" required className="input-field pl-10 bg-black/20 text-sm" placeholder="Empresa S.A." />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="label text-sm">Correo Electrónico</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                                        <Mail size={16} />
                                    </div>
                                    <input type="email" id="email" name="email" required className="input-field pl-10 bg-black/20 text-sm" placeholder="cliente@email.com" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="label text-sm">Contraseña Temporal</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                                        <Lock size={16} />
                                    </div>
                                    <input type="text" id="password" name="password" required className="input-field pl-10 bg-black/20 text-sm" placeholder="Contraseña segura" minLength={6} />
                                </div>
                            </div>

                            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-6 py-2.5 flex justify-center items-center gap-2">
                                {isLoading ? (
                                    <><Loader2 size={18} className="animate-spin" /> Creando...</>
                                ) : (
                                    <><Plus size={18} /> Registrar Cliente</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
