'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCommissionAction(formData: FormData) {
    const userId = formData.get('userId') as string
    const commission = parseFloat(formData.get('commission') as string)

    if (!userId || isNaN(commission)) {
        throw new Error('Datos inválidos')
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autorizado')

    // Verificamos de nuevo que sea admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error('Acceso Denegado')
    }

    // Update commission
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ commission_percentage: commission })
        .eq('id', userId)

    if (updateError) {
        console.error(updateError)
        throw new Error('Error al actualizar comisión')
    }

    revalidatePath('/dashboard/admin')
}
