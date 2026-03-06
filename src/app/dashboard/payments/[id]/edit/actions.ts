'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPaymentAction(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error) return { error: 'No se encontró el pago' }
    return data
}

export async function updatePaymentAction(formData: FormData) {
    const id = formData.get('id') as string
    const clientName = formData.get('clientName') as string
    const amount = formData.get('amount') as string
    const date = formData.get('date') as string

    if (!id || !clientName || !amount || !date) {
        return { error: 'Por favor, completa todos los campos.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { error } = await supabase
        .from('payments')
        .update({
            client_name: clientName,
            amount: parseFloat(amount),
            payment_date: date
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error(error)
        return { error: 'Error al actualizar en la base de datos.' }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/payments/${id}/edit`)
    return { success: true }
}
