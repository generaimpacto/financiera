'use client'

import { useState } from 'react'
import { addPaymentAction } from './actions'
import { Upload, FileImage, Loader2, Users } from 'lucide-react'

interface ClientOption {
    id: string
    business_name: string | null
}

export default function NewPaymentPage({ searchParams }: { searchParams: any }) {
    return <PaymentFormWrapper />
}

function PaymentFormWrapper() {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
    const [clients, setClients] = useState<ClientOption[]>([])
    const [isAdmin, setIsAdmin] = useState(false)
    const [loaded, setLoaded] = useState(false)

    // Fetch admin status and client list on mount
    if (!loaded && typeof window !== 'undefined') {
        fetch('/api/admin-clients')
            .then(res => res.json())
            .then(data => {
                setIsAdmin(data.isAdmin || false)
                setClients(data.clients || [])
                setLoaded(true)
            })
            .catch(() => setLoaded(true))
    }

    async function handleSubmit(formData: FormData) {
        setIsUploading(true)
        setError(null)
        try {
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
                            <p className="text-xs text-indigo-300/60 mt-1">Como admin, este ingreso se cargará en la cuenta del cliente seleccionado.</p>
                        </div>
                    )}

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
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-[var(--border-color)] px-6 py-10 bg-black/10 hover:bg-black/20 transition-colors relative">
                            <div className="text-center">
                                <FileImage className={`mx-auto h-12 w-12 ${selectedFileName ? 'text-emerald-400' : 'text-secondary'}`} aria-hidden="true" />
                                <div className="mt-4 flex text-sm leading-6 text-gray-400 justify-center">
                                    <label
                                        htmlFor="receipt"
                                        className="relative cursor-pointer rounded-md bg-transparent font-semibold text-[var(--accent-color)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--accent-color)] focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-[var(--accent-hover)]"
                                    >
                                        <span>{selectedFileName ? 'Cambiar archivo' : 'Sube un archivo'}</span>
                                        <input
                                            id="receipt"
                                            name="receipt"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            required
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    setSelectedFileName(e.target.files[0].name)
                                                }
                                            }}
                                        />
                                    </label>
                                    {!selectedFileName && <p className="pl-1">o arrástralo y suéltalo</p>}
                                </div>
                                {selectedFileName ? (
                                    <p className="text-sm font-medium text-emerald-400 mt-2">{selectedFileName}</p>
                                ) : (
                                    <p className="text-xs leading-5 text-gray-400">PNG, JPG up to 5MB</p>
                                )}
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
