'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPaymentAction(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    // Check if admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin'

    let query = supabase.from('payments').select('*').eq('id', id)
    if (!isAdmin) {
        query = query.eq('user_id', user.id)
    }

    const { data, error } = await query.single()

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

    // Check if admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin'

    let query = supabase
        .from('payments')
        .update({
            client_name: clientName,
            amount: parseFloat(amount),
            payment_date: date
        })
        .eq('id', id)

    if (!isAdmin) {
        query = query.eq('user_id', user.id)
    }

    const { error } = await query

    if (error) {
        console.error(error)
        return { error: 'Error al actualizar en la base de datos.' }
    }

    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/movements')
    revalidatePath(`/dashboard/payments/${id}/edit`)
    return { success: true }
}
