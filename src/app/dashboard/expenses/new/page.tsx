'use client'

import { useEffect, useState } from 'react'
import { addExpenseAction } from './actions'
import { Upload, FileImage, Loader2, Users, Sparkles } from 'lucide-react'

interface ClientOption {
    id: string
    business_name: string | null
}

function fmt(n: number) {
    return '$ ' + Math.round(n).toLocaleString('es-AR')
}

export default function NewExpensePage() {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
    const [clients, setClients] = useState<ClientOption[]>([])
    const [isAdmin, setIsAdmin] = useState(false)

    // Estado controlado
    const [targetUserId, setTargetUserId] = useState('')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [isCommissionPayment, setIsCommissionPayment] = useState(false)

    // Comisión pendiente del cliente seleccionado
    const [commission, setCommission] = useState<{ pending: number; generated: number; paid: number } | null>(null)

    useEffect(() => {
        fetch('/api/admin-clients')
            .then((res) => res.json())
            .then((data) => {
                setIsAdmin(data.isAdmin || false)
                setClients(data.clients || [])
            })
            .catch(() => {})
    }, [])

    // Al cambiar de cliente, traer su comisión pendiente.
    useEffect(() => {
        if (!isAdmin || !targetUserId) {
            setCommission(null)
            return
        }
        let cancel = false
        fetch(`/api/client-commission?clientId=${targetUserId}`)
            .then((r) => r.json())
            .then((d) => {
                if (!cancel && typeof d.pending === 'number') setCommission(d)
            })
            .catch(() => {})
        return () => {
            cancel = true
        }
    }, [targetUserId, isAdmin])

    const clientName = clients.find((c) => c.id === targetUserId)?.business_name || 'el cliente'
    const pending = commission?.pending ?? 0

    function registrarPagoComision() {
        setIsCommissionPayment(true)
        setAmount(String(Math.round(pending * 100) / 100))
        if (!description.trim()) setDescription('Pago de comisión')
    }

    function onToggleCommission(checked: boolean) {
        setIsCommissionPayment(checked)
        if (checked && pending > 0 && !amount) {
            setAmount(String(Math.round(pending * 100) / 100))
        }
    }

    async function handleSubmit(formData: FormData) {
        setIsUploading(true)
        setError(null)
        try {
            const result = await addExpenseAction(formData)
            if (result?.error) {
                setError(result.error)
                setIsUploading(false)
            }
        } catch (err: any) {
            if (err.digest?.startsWith('NEXT_REDIRECT') || err.message === 'NEXT_REDIRECT') throw err
            setError(err.message || 'Se produjo un error al cargar el egreso.')
            setIsUploading(false)
        }
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
                    Registrar Egreso
                </h1>
                <p className="text-secondary mt-2">
                    Añade un nuevo gasto{isAdmin ? ' a la cuenta de un cliente' : ' a tu cuenta'} (comprobante opcional)
                </p>
            </header>

            {error && (
                <div role="alert" className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6">{error}</div>
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
                                value={targetUserId}
                                onChange={(e) => setTargetUserId(e.target.value)}
                                className="input-field bg-black/30 text-white border-indigo-500/30 mt-1"
                                required
                            >
                                <option value="">— Seleccionar cliente —</option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.business_name || `Cliente ${c.id.split('-')[0]}`}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-indigo-300/60 mt-1">Como admin, este egreso se cargará en la cuenta del cliente seleccionado.</p>
                        </div>
                    )}

                    {/* Comisión: recomendación + checkbox (justo después de elegir cliente) */}
                    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4 space-y-3">
                        {isAdmin && targetUserId && pending > 0 && !isCommissionPayment && (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-purple-500/10 border border-purple-500/30 p-3">
                                <div className="text-sm flex items-start gap-2">
                                    <Sparkles size={16} className="text-purple-300 mt-0.5 shrink-0" />
                                    <span className="text-purple-100">
                                        {clientName} tiene <b className="text-white">{fmt(pending)}</b> de comisión pendiente.
                                        <span className="block text-xs text-secondary">¿Este egreso es el pago de la comisión?</span>
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={registrarPagoComision}
                                    className="shrink-0 text-xs font-semibold bg-purple-500/30 text-purple-100 px-3 py-1.5 rounded-lg hover:bg-purple-500/50 transition-colors"
                                >
                                    Registrar pago ({fmt(pending)})
                                </button>
                            </div>
                        )}

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isCommissionPayment"
                                checked={isCommissionPayment}
                                onChange={(e) => onToggleCommission(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/30 accent-purple-500"
                            />
                            <span>
                                <span className="block text-sm font-medium text-purple-200">Es un pago de comisión a la agencia</span>
                                <span className="block text-xs text-secondary mt-0.5">
                                    Marcá esto cuando el cliente te paga la comisión. Se descuenta de la comisión pendiente (no es un gasto operativo).
                                </span>
                            </span>
                        </label>
                    </div>

                    <div>
                        <label htmlFor="description" className="label">Descripción del Gasto</label>
                        <input
                            id="description"
                            name="description"
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej. Pago de servicios, Proveedor X..."
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
                                min="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
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
                                defaultValue={new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())}
                                className="input-field"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label flex justify-between">
                            <span>Comprobante (Imagen)</span>
                            <span className="text-xs text-secondary font-normal">Opcional</span>
                        </label>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-[var(--border-color)] px-6 py-10 bg-black/10 hover:bg-black/20 transition-colors relative">
                            <div className="text-center">
                                <FileImage className={`mx-auto h-12 w-12 ${selectedFileName ? 'text-emerald-400' : 'text-secondary'}`} aria-hidden="true" />
                                <div className="mt-4 flex text-sm leading-6 text-gray-400 justify-center">
                                    <label
                                        htmlFor="receipt"
                                        className="relative cursor-pointer rounded-md bg-transparent font-semibold text-[var(--accent-color)] hover:text-[var(--accent-hover)]"
                                    >
                                        <span>{selectedFileName ? 'Cambiar archivo' : 'Sube un archivo'}</span>
                                        <input
                                            id="receipt"
                                            name="receipt"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
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
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2" size={20} />
                                    Guardar Egreso
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
