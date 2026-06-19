import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'

type Profile = { role: string; commission_percentage: number; business_name: string | null }

/**
 * Usuario + perfil del request actual. Cacheado por render (React cache):
 * layout y página comparten una sola llamada a getUser() + una sola query de perfil,
 * en vez de repetirlas. Reduce viajes de red a Supabase por navegación.
 */
export const getSession = cache(async (): Promise<{ user: { id: string; email?: string } | null; profile: Profile | null }> => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { user: null, profile: null }
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, commission_percentage, business_name')
        .eq('id', user.id)
        .single()
    return { user, profile: (profile as Profile) ?? null }
})
