'use client'

import { useState, useEffect } from 'react'
import { updatePaymentAction, getPaymentAction } from './actions'
import { Save, Loader2, ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

export default function EditPaymentPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [initialData, setInitialData] = useState<any>(null)

    useEffect(() => {
        async function load() {
            const data = await getPaymentAction(id)
            if (data?.error) {
                setError(data.error)
            } else {
                setInitialData(data)
            }
        }
        load()
    }, [id])

    async function handleSubmit(formData: FormData) {
        setIsSaving(true)
        setError(null)
        formData.append('id', id)
        try {
            const result = await updatePaymentAction(formData)
            if (result?.error) {
                setError(result.error)
            } else {
                router.push('/dashboard')
            }
        } catch (err: any) {
            setError(err.message || 'Error al actualizar.')
        } finally {
            setIsSaving(false)
        }
    }

    if (!initialData && !error) return <div className="p-8 text-center text-secondary"><Loader2 className="animate-spin text-emerald-500 inline-block mr-2" />Cargando...</div>

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <header className="mb-8 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors text-secondary hover:text-white border border-white/10 bg-black/20">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                        Editar Ingreso
                    </h1>
                    <p className="text-secondary mt-1">Modifica los detalles del pago</p>
                </div>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {initialData && (
                <div className="glass-panel p-8">
                    <form action={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="clientName" className="label">Nombre del Cliente</label>
                            <input
                                id="clientName"
                                name="clientName"
                                type="text"
                                required
                                defaultValue={initialData.client_name}
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
                                    defaultValue={initialData.amount}
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
                                    defaultValue={initialData.payment_date}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[var(--border-color)]">
                            <button type="submit" disabled={isSaving} className="btn-primary w-full sm:w-auto">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={20} />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2" size={20} />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
