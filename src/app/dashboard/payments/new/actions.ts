'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function addPaymentAction(formData: FormData) {
    const clientName = formData.get('clientName') as string
    const amount = formData.get('amount') as string
    const date = formData.get('date') as string
    const file = formData.get('receipt') as File

    if (!clientName || !amount || !date || !file || file.size === 0) {
        return { error: 'Faltan campos obligatorios o el archivo' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autorizado' }

    // Check if admin is assigning to a specific client
    const targetUserId = formData.get('targetUserId') as string
    let assignToUserId = user.id

    if (targetUserId && targetUserId !== '') {
        // Verify the current user is an admin
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') {
            assignToUserId = targetUserId
        }
    }

    // 1. Upload image to Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${assignToUserId}-${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    // Convert File to ArrayBuffer for supabase upload
    const fileBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, fileBuffer, {
            contentType: file.type
        })

    if (uploadError) {
        console.error(uploadError)
        return { error: 'Error al subir la imagen del comprobante.' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

    // 2. Insert into database
    const { error: insertError } = await supabase.from('payments').insert({
        user_id: assignToUserId,
        client_name: clientName,
        amount: parseFloat(amount),
        payment_date: date,
        receipt_url: publicUrl
    })

    if (insertError) {
        console.error(insertError)
        // Rollback is usually good here but skip for brevity
        return { error: 'Error al registrar el pago en la base de datos.' }
    }

    redirect('/dashboard')
}
