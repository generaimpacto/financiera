'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { sendDiscordNotification, formatCurrencyForNotification } from '@/utils/discord'

export async function addExpenseAction(formData: FormData) {
    const description = formData.get('description') as string
    const amount = formData.get('amount') as string
    const date = formData.get('date') as string
    const file = formData.get('receipt') as File | null

    if (!description || !amount || !date) {
        return { error: 'Faltan campos obligatorios' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autorizado' }

    // Check if admin is assigning to a specific client
    const targetUserId = formData.get('targetUserId') as string
    let assignToUserId = user.id

    if (targetUserId && targetUserId !== '') {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') {
            assignToUserId = targetUserId
        }
    }

    let publicUrl = null

    // Upload receipt image if provided
    if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop()
        const fileName = `expense-${assignToUserId}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

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

        const { data } = supabase.storage
            .from('receipts')
            .getPublicUrl(filePath)
            
        publicUrl = data.publicUrl
    }

    const { error: insertError } = await supabase.from('expenses').insert({
        user_id: assignToUserId,
        description,
        amount: parseFloat(amount),
        expense_date: date,
        ...(publicUrl && { receipt_url: publicUrl })
    })

    if (insertError) {
        console.error(insertError)
        return { error: 'Error al guardar el egreso en la base de datos' }
    }

    // Send Discord notification
    const { data: ownerProfile } = await supabase.from('profiles').select('business_name').eq('id', assignToUserId).single()
    const ownerName = ownerProfile?.business_name || 'Usuario'
    await sendDiscordNotification(`📤 **${ownerName}** ha egresado: **${formatCurrencyForNotification(parseFloat(amount))}**`)

    redirect('/dashboard')
}
