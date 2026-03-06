'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function addExpenseAction(formData: FormData) {
    const description = formData.get('description') as string
    const amount = formData.get('amount') as string
    const date = formData.get('date') as string

    if (!description || !amount || !date) {
        throw new Error('Faltan campos obligatorios')
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autorizado')

    // Check if admin is assigning to a specific client
    const targetUserId = formData.get('targetUserId') as string
    let assignToUserId = user.id

    if (targetUserId && targetUserId !== '') {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') {
            assignToUserId = targetUserId
        }
    }

    const { error } = await supabase.from('expenses').insert({
        user_id: assignToUserId,
        description,
        amount: parseFloat(amount),
        expense_date: date
    })

    if (error) {
        console.error(error)
        throw new Error('Error al guardar el egreso')
    }

    redirect('/dashboard')
}
