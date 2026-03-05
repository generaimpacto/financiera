import { addExpenseAction } from './actions'

export default function NewExpensePage() {
    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
                    Registrar Egreso
                </h1>
                <p className="text-secondary mt-2">Añade un nuevo gasto a tu cuenta</p>
            </header>

            <div className="glass-panel p-8">
                <form action={addExpenseAction} className="space-y-6">
                    <div>
                        <label htmlFor="description" className="label">Descripción del Gasto</label>
                        <input
                            id="description"
                            name="description"
                            type="text"
                            required
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

                    <div className="pt-4 border-t border-[var(--border-color)]">
                        <button type="submit" className="btn-primary">
                            Guardar Egreso
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
