'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Lock, Mail, AlertCircle } from 'lucide-react'
import { loginAction } from './actions'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)

        const result = await loginAction(formData)

        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>

            <div className="glass-panel w-full max-w-md p-8 relative z-10 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-color)] bg-opacity-10 text-[var(--accent-color)] mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Bienvenido</h1>
                    <p className="text-secondary">Ingresa a tu portal financiero privado</p>
                </div>

                {error && (
                    <div className="bg-red-500 bg-opacity-10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <p className="text-sm text-red-200">{error}</p>
                    </div>
                )}

                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="label">Correo Electrónico</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                                <Mail size={18} />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="input-field pl-10 bg-black/20"
                                placeholder="tu@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="label">Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                                <Lock size={18} />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="input-field pl-10 bg-black/20"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <span className="opacity-80">Ingresando...</span>
                        ) : (
                            <>
                                <span>Ingresar al Dashboard</span>
                                <LogIn size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
