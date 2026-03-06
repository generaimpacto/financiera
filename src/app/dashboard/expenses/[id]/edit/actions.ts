'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getExpenseAction(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error) return { error: 'No se encontró el gasto' }
    return data
}

export async function updateExpenseAction(formData: FormData) {
    const id = formData.get('id') as string
    const description = formData.get('description') as string
    const amount = formData.get('amount') as string
    const date = formData.get('date') as string

    if (!id || !description || !amount || !date) {
        return { error: 'Por favor, completa todos los campos.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { error } = await supabase
        .from('expenses')
        .update({
            description: description,
            amount: parseFloat(amount),
            expense_date: date
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error(error)
        return { error: 'Error al actualizar en la base de datos.' }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/expenses/${id}/edit`)
    return { success: true }
}
