'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Por favor completa todos los campos' }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        if (error.message.includes('Invalid login credentials')) {
            return { error: 'Correo o contraseña incorrectos' }
        }
        return { error: error.message }
    }

    // Éxito, redirigir al dashboard
    return { error: null }
}
