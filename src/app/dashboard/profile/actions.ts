'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateBusinessNameAction(formData: FormData) {
    const businessName = formData.get('businessName') as string

    if (!businessName || businessName.trim().length < 2) {
        return { error: 'El nombre debe tener al menos 2 caracteres.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autorizado.' }

    // Update profiles table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ business_name: businessName.trim() })
        .eq('id', user.id)

    if (profileError) {
        return { error: 'Error al actualizar el nombre: ' + profileError.message }
    }

    // Sync user metadata in Auth
    await supabase.auth.updateUser({
        data: { business_name: businessName.trim() }
    })

    revalidatePath('/dashboard')
    return { success: true, message: 'Nombre actualizado correctamente.' }
}

export async function updatePasswordAction(formData: FormData) {
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!newPassword || newPassword.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres.' }
    }

    if (newPassword !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autorizado.' }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
        return { error: 'Error al cambiar la contraseña: ' + error.message }
    }

    return { success: true, message: 'Contraseña actualizada correctamente.' }
}
