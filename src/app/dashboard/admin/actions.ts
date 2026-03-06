'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCommissionAction(formData: FormData) {
    const userId = formData.get('userId') as string
    const commission = parseFloat(formData.get('commission') as string)

    if (isNaN(commission) || commission < 0 || commission > 100) return

    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({ commission_percentage: commission })
        .eq('id', userId)

    if (error) {
        console.error('Error updating commission:', error)
    }

    revalidatePath('/dashboard/admin')
}

export async function adminCreateUserAction(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const businessName = formData.get('businessName') as string

    if (!email || !password || !businessName) {
        return { error: 'Por favor, completa todos los campos.' }
    }

    // Require Service Role Key to bypass RLS and Auth limits
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        return { error: 'Falta la clave SUPABASE_SERVICE_ROLE_KEY en el servidor.' }
    }

    // Use admin supabase client
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // 1. Create the user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            business_name: businessName
        }
    })

    if (authError) {
        return { error: authError.message }
    }

    revalidatePath('/dashboard/admin')
    return { success: true, message: 'Usuario creado exitosamente.' }
}
