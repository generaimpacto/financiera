'use client'

import { useState } from 'react'
import { Building2, Lock, Mail, Save, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react'
import { updateBusinessNameAction, updatePasswordAction } from './actions'

export default function ProfilePage({ searchParams }: { searchParams: any }) {
    return <ProfileForm />
}

function ProfileForm() {
    const [nameLoading, setNameLoading] = useState(false)
    const [passLoading, setPassLoading] = useState(false)
    const [nameMsg, setNameMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
    const [passMsg, setPassMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
    const [showPass, setShowPass] = useState(false)

    async function handleNameSubmit(formData: FormData) {
        setNameLoading(true)
        setNameMsg(null)
        const result = await updateBusinessNameAction(formData)
        if (result?.error) {
            setNameMsg({ text: String(result.error), type: 'error' })
        } else if (result?.success) {
            setNameMsg({ text: String(result.message), type: 'success' })
        }
        setNameLoading(false)
    }

    async function handlePassSubmit(formData: FormData) {
        setPassLoading(true)
        setPassMsg(null)
        const result = await updatePasswordAction(formData)
        if (result?.error) {
            setPassMsg({ text: String(result.error), type: 'error' })
        } else if (result?.success) {
            setPassMsg({ text: String(result.message), type: 'success' })
        }
        setPassLoading(false)
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Configuración de Perfil
                </h1>
                <p className="text-secondary mt-2">Gestiona tu información personal y seguridad</p>
            </header>

            {/* Business Name Section */}
            <section className="glass-panel p-8 mb-8 border-l-4 border-l-blue-500">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-3">
                    <Building2 className="text-blue-400" size={22} />
                    Datos del Negocio
                </h2>
                <p className="text-sm text-secondary mb-6">
                    Este nombre aparecerá en el panel de administración y te identificará dentro de la plataforma.
                </p>

                {nameMsg && (
                    <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 border ${nameMsg.type === 'error' ? 'bg-red-500/10 border-red-500/50' : 'bg-emerald-500/10 border-emerald-500/50'}`}>
                        {nameMsg.type === 'error' ? (
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                        ) : (
                            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                        )}
                        <p className={`text-sm ${nameMsg.type === 'error' ? 'text-red-200' : 'text-emerald-200'}`}>{nameMsg.text}</p>
                    </div>
                )}

                <form action={handleNameSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="businessName" className="label">Nombre del Negocio</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                                <Building2 size={18} />
                            </div>
                            <input
                                type="text"
                                id="businessName"
                                name="businessName"
                                required
                                minLength={2}
                                className="input-field pl-10 bg-black/20"
                                placeholder="Mi Empresa S.A."
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={nameLoading} className="btn-primary py-2.5 px-6 flex items-center gap-2 text-sm">
                        {nameLoading ? (
                            <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                        ) : (
                            <><Save size={16} /> Guardar Nombre</>
                        )}
                    </button>
                </form>
            </section>

            {/* Password Section */}
            <section className="glass-panel p-8 mb-8 border-l-4 border-l-purple-500">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-3">
                    <Lock className="text-purple-400" size={22} />
                    Seguridad
                </h2>
                <p className="text-sm text-secondary mb-6">
                    Cambia tu contraseña de acceso. La nueva clave debe tener al menos 6 caracteres.
                </p>

                {passMsg && (
                    <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 border ${passMsg.type === 'error' ? 'bg-red-500/10 border-red-500/50' : 'bg-emerald-500/10 border-emerald-500/50'}`}>
                        {passMsg.type === 'error' ? (
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                        ) : (
                            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                        )}
                        <p className={`text-sm ${passMsg.type === 'error' ? 'text-red-200' : 'text-emerald-200'}`}>{passMsg.text}</p>
                    </div>
                )}

                <form action={handlePassSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="newPassword" className="label">Nueva Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPass ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                required
                                minLength={6}
                                className="input-field pl-10 pr-12 bg-black/20"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-white transition-colors"
                            >
                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="label">Confirmar Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPass ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                required
                                minLength={6}
                                className="input-field pl-10 bg-black/20"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={passLoading} className="btn-primary py-2.5 px-6 flex items-center gap-2 text-sm bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400">
                        {passLoading ? (
                            <><Loader2 size={16} className="animate-spin" /> Actualizando...</>
                        ) : (
                            <><Lock size={16} /> Cambiar Contraseña</>
                        )}
                    </button>
                </form>
            </section>

            {/* Info Card */}
            <div className="glass-card p-6 border-t-4 border-t-amber-500/50">
                <div className="flex items-start gap-3">
                    <Mail className="text-amber-400 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="font-bold text-white mb-1">¿Necesitas cambiar tu correo electrónico?</h3>
                        <p className="text-sm text-secondary">
                            Por seguridad, los cambios de correo electrónico deben ser solicitados al administrador de la plataforma.
                            Contacta al equipo de soporte para realizar esta gestión.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
