'use client'

import { useState } from 'react'
import { addPaymentAction } from './actions'
import { Upload, FileImage, Loader2 } from 'lucide-react'

export default function NewPaymentPage() {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setIsUploading(true)
        setError(null)
        try {
            // Usaremos una server action
            const result = await addPaymentAction(formData)
            if (result?.error) {
                setError(result.error)
            }
        } catch (err: any) {
            setError(err.message || 'Se produjo un error al cargar el pago.')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                    Registrar Ingreso
                </h1>
                <p className="text-secondary mt-2">Añade un pago de cliente con su comprobante</p>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <div className="glass-panel p-8">
                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="clientName" className="label">Nombre del Cliente</label>
                        <input
                            id="clientName"
                            name="clientName"
                            type="text"
                            required
                            placeholder="Ej. Juan Pérez"
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

                    <div>
                        <label className="label">Comprobante (Imagen)</label>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-[var(--border-color)] px-6 py-10 bg-black/10 hover:bg-black/20 transition-colors">
                            <div className="text-center">
                                <FileImage className="mx-auto h-12 w-12 text-secondary" aria-hidden="true" />
                                <div className="mt-4 flex text-sm leading-6 text-gray-400">
                                    <label
                                        htmlFor="receipt"
                                        className="relative cursor-pointer rounded-md bg-transparent font-semibold text-[var(--accent-color)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--accent-color)] focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-[var(--accent-hover)]"
                                    >
                                        <span>Sube un archivo</span>
                                        <input id="receipt" name="receipt" type="file" accept="image/*" className="sr-only" required />
                                    </label>
                                    <p className="pl-1">o arrástralo y suéltalo</p>
                                </div>
                                <p className="text-xs leading-5 text-gray-400">PNG, JPG up to 5MB</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--border-color)]">
                        <button type="submit" disabled={isUploading} className="btn-primary">
                            {isUploading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                    Guardando y subiendo imagen...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2" size={20} />
                                    Guardar Ingreso
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
