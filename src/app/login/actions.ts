'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const businessName = formData.get('businessName') as string
    const isSignUp = formData.get('actionType') === 'signup'

    if (!email || !password) {
        return { error: 'Por favor completa todos los campos' }
    }
    if (isSignUp && !businessName) {
        return { error: 'El nombre de negocio es requerido para registrarse' }
    }

    const supabase = await createClient()

    if (isSignUp) {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    business_name: businessName
                }
            }
        })

        if (error) {
            return { error: error.message }
        }
        return { success: true, message: '¡Cuenta creada con éxito! Ya puedes iniciar sesión.' }
    }

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

    // Éxito
    return { success: true, error: null }
}
