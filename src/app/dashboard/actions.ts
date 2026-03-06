'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteTransactionAction(formData: FormData) {
    const id = formData.get('id') as string
    const type = formData.get('type') as string

    if (!id || !type) throw new Error('Parámetros inválidos')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autorizado')

    const tableName = type === 'income' ? 'payments' : 'expenses'

    const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Security check to ensure owner

    if (error) {
        console.error('Error deleting transaction:', error)
        throw new Error('Error al eliminar el movimiento')
    }

    revalidatePath('/dashboard')
}
