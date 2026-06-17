'use client'

import { useEffect, useState } from 'react'
import { addMovementAction } from './actions'
import { Upload, FileImage, Loader2, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface ClientOption {
    id: string
    business_name: string | null
}

export default function NewMovementPage() {
    const [type, setType] = useState<'income' | 'expense'>('income')
    const [scope, setScope] = useState<'agency' | 'client'>('agency')
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
    const [clients, setClients] = useState<ClientOption[]>([])

    useEffect(() => {
        fetch('/api/admin-clients')
            .then((res) => res.json())
            .then((data) => setClients(data.clients || []))
            .catch(() => {})
    }, [])

    async function handleSubmit(formData: FormData) {
        setIsUploading(true)
        setError(null)
        try {
            const result = await addMovementAction(formData)
            if (result?.error) {
                setError(result.error)
                setIsUploading(false)
            }
        } catch (err: any) {
            if (err.digest?.startsWith('NEXT_REDIRECT') || err.message === 'NEXT_REDIRECT') throw err
            setError(err.message || 'Se produjo un error al cargar el movimiento.')
            setIsUploading(false)
        }
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Nuevo movimiento
                </h1>
                <p className="text-secondary mt-2">Registrá un ingreso o egreso (agencia o cliente).</p>
            </header>

            {error && (
                <div role="alert" className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6">{error}</div>
            )}

            <div className="glass-panel p-8">
                <form action={handleSubmit} className="space-y-6">
                    {/* Tipo: ingreso / egreso */}
                    <input type="hidden" name="type" value={type} />
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-semibold transition-colors ${
                                type === 'income'
                                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                                    : 'border-[var(--border-color)] text-gray-400 hover:bg-white/5'
                            }`}
                        >
                            <ArrowUpRight size={18} /> Ingreso
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-semibold transition-colors ${
                                type === 'expense'
                                    ? 'border-red-500/40 bg-red-500/15 text-red-300'
                                    : 'border-[var(--border-color)] text-gray-400 hover:bg-white/5'
                            }`}
                        >
                            <ArrowDownRight size={18} /> Egreso
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="amount" className="label">Monto (ARS)</label>
                            <input id="amount" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" className="input-field" />
                        </div>
                        <div>
                            <label htmlFor="date" className="label">Fecha</label>
                            <input id="date" name="date" type="date" required defaultValue={new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())} className="input-field" />
                        </div>
                    </div>

                    {/* Alcance: agencia / cliente */}
                    <div>
                        <label htmlFor="scope" className="label">¿De quién es el movimiento?</label>
                        <select
                            id="scope"
                            name="scope"
                            value={scope}
                            onChange={(e) => setScope(e.target.value as 'agency' | 'client')}
                            className="input-field"
                        >
                            <option value="agency">De la agencia</option>
                            <option value="client">De un cliente</option>
                        </select>
                    </div>

                    {scope === 'client' && (
                        <div className="bg-indigo-500/5 border border-indigo-500/30 rounded-lg p-4">
                            <label htmlFor="clientId" className="label flex items-center gap-2 text-indigo-300">
                                <Users size={16} /> Cliente
                            </label>
                            <select id="clientId" name="clientId" className="input-field bg-black/30 border-indigo-500/30 mt-1" required={scope === 'client'}>
                                <option value="">— Seleccionar cliente —</option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.business_name || `Cliente ${c.id.split('-')[0]}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="concept" className="label">Concepto</label>
                            <input id="concept" name="concept" type="text" placeholder="Ej: Honorarios, ads, sueldo…" className="input-field" />
                        </div>
                        <div>
                            <label htmlFor="origin" className="label">Origen (opcional)</label>
                            <input id="origin" name="origin" type="text" placeholder="Ej: Banco Galicia, caja, MP…" className="input-field" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="paymentMethod" className="label">Método de pago</label>
                        <select id="paymentMethod" name="paymentMethod" defaultValue="transferencia" className="input-field">
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="tarjeta">Tarjeta</option>
                            <option value="debito">Débito</option>
                            <option value="cheque">Cheque</option>
                            <option value="mercadopago">MercadoPago</option>
                            <option value="cripto">Cripto</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="notes" className="label">Notas (opcional)</label>
                        <textarea id="notes" name="notes" rows={2} placeholder="Detalle adicional…" className="input-field" />
                    </div>

                    {/* Comprobante (opcional) */}
                    <div>
                        <label className="label">Comprobante (opcional)</label>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-[var(--border-color)] px-6 py-8 bg-black/10 hover:bg-black/20 transition-colors">
                            <div className="text-center">
                                <FileImage className={`mx-auto h-10 w-10 ${selectedFileName ? 'text-emerald-400' : 'text-secondary'}`} aria-hidden="true" />
                                <div className="mt-3 flex text-sm leading-6 text-gray-400 justify-center">
                                    <label htmlFor="receipt" className="relative cursor-pointer rounded-md font-semibold text-[var(--accent-color)] hover:text-[var(--accent-hover)]">
                                        <span>{selectedFileName ? 'Cambiar archivo' : 'Subir imagen'}</span>
                                        <input
                                            id="receipt"
                                            name="receipt"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || null)}
                                        />
                                    </label>
                                </div>
                                {selectedFileName ? (
                                    <p className="text-sm font-medium text-emerald-400 mt-1">{selectedFileName}</p>
                                ) : (
                                    <p className="text-xs leading-5 text-gray-400">PNG, JPG (opcional)</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--border-color)]">
                        <button type="submit" disabled={isUploading} className="btn-primary">
                            {isUploading ? (
                                <><Loader2 className="animate-spin mr-2 inline" size={20} /> Guardando…</>
                            ) : (
                                <><Upload className="mr-2 inline" size={20} /> Guardar movimiento</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
