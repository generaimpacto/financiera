'use client'

import { Trash2 } from 'lucide-react'
import { deleteMovementAction } from './actions'

export function DeleteMovementButton({ id }: { id: string }) {
    return (
        <form
            action={deleteMovementAction}
            onSubmit={(e) => {
                if (!confirm('¿Eliminar este movimiento? Esta acción no se puede deshacer.')) e.preventDefault()
            }}
        >
            <input type="hidden" name="id" value={id} />
            <button
                type="submit"
                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                title="Eliminar"
            >
                <Trash2 size={16} aria-hidden="true" />
            </button>
        </form>
    )
}
