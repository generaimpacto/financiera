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

    const { error } = await supabase.from('expenses').insert({
        user_id: user.id,
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
