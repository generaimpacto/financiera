'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteMovementAction(formData: FormData) {
    const id = formData.get('id') as string
    if (!id) return

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Defensa en profundidad (además de la RLS): solo admin borra.
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return

    // Recuperar el comprobante para limpiarlo del storage (best-effort).
    const { data: mov } = await supabase.from('movements').select('receipt_url').eq('id', id).single()

    await supabase.from('movements').delete().eq('id', id)

    if (mov?.receipt_url) {
        const path = mov.receipt_url.split('/receipts/')[1]
        if (path) await supabase.storage.from('receipts').remove([decodeURIComponent(path)])
    }

    revalidatePath('/dashboard/ledger')
}
