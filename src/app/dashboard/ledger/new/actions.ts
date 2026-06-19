'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { sendDiscordNotification, formatCurrencyForNotification } from '@/utils/discord'

const METODOS = ['efectivo', 'transferencia', 'tarjeta', 'debito', 'cheque', 'mercadopago', 'cripto', 'otro']
const EXT_BY_TYPE: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
}

export async function addMovementAction(formData: FormData) {
    const type = formData.get('type') as string
    const amount = formData.get('amount') as string
    const date = formData.get('date') as string
    const scope = (formData.get('scope') as string) || 'agency'
    const clientId = (formData.get('clientId') as string) || ''
    const origin = ((formData.get('origin') as string) || '').trim()
    const concept = ((formData.get('concept') as string) || '').trim()
    const paymentMethod = (formData.get('paymentMethod') as string) || 'transferencia'
    const notes = ((formData.get('notes') as string) || '').trim()
    const file = formData.get('receipt') as File | null

    // Validación
    if (!['income', 'expense'].includes(type)) return { error: 'Tipo de movimiento inválido.' }
    const amountNum = parseFloat(amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) return { error: 'Ingresá un monto mayor a 0.' }
    if (!date) return { error: 'La fecha es obligatoria.' }
    if (!METODOS.includes(paymentMethod)) return { error: 'Método de pago inválido.' }
    if (!['agency', 'client'].includes(scope)) return { error: 'Alcance inválido.' }
    if (scope === 'client' && !clientId) return { error: 'Elegí el cliente del movimiento.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado.' }

    // Solo admin gestiona el libro (RLS también lo refuerza).
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Solo un administrador puede cargar movimientos.' }

    // Cliente (opcional): validar que sea un perfil real role='user' y denormalizar nombre.
    let clientName: string | null = null
    if (scope === 'client') {
        const { data: cli } = await supabase.from('profiles').select('business_name, role').eq('id', clientId).single()
        if (!cli || cli.role !== 'user') return { error: 'Cliente inválido.' }
        clientName = cli.business_name || `Cliente ${clientId.split('-')[0]}`
    }

    // Comprobante (opcional): validar tipo y tamaño; nombre aleatorio no enumerable.
    let receiptUrl: string | null = null
    if (file && file.size > 0) {
        if (!file.type.startsWith('image/')) return { error: 'El comprobante debe ser una imagen.' }
        if (file.size > 5 * 1024 * 1024) return { error: 'El comprobante supera el tamaño máximo (5 MB).' }
        const ext = EXT_BY_TYPE[file.type] || 'img'
        const filePath = `mov-${crypto.randomUUID()}.${ext}`
        const fileBuffer = await file.arrayBuffer()
        const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(filePath, fileBuffer, { contentType: file.type })
        if (uploadError) {
            console.error(uploadError)
            return { error: 'Error al subir el comprobante.' }
        }
        receiptUrl = supabase.storage.from('receipts').getPublicUrl(filePath).data.publicUrl
    }

    const { error: insertError } = await supabase.from('movements').insert({
        type,
        amount: amountNum,
        movement_date: date,
        origin: origin || null,
        scope,
        client_id: scope === 'client' ? clientId : null,
        client_name: clientName,
        concept: concept || null,
        payment_method: paymentMethod,
        notes: notes || null,
        receipt_url: receiptUrl,
        created_by: user.id,
    })

    if (insertError) {
        console.error(insertError)
        return { error: 'Error al registrar el movimiento.' }
    }

    const emoji = type === 'income' ? '🟢 Ingreso' : '🔴 Egreso'
    const quien = scope === 'client' ? (clientName || 'cliente') : 'agencia'
    after(() =>
        sendDiscordNotification(
            `${emoji} (${quien}): **${formatCurrencyForNotification(amountNum)}**${concept ? ` · ${concept}` : ''}`
        )
    )

    revalidatePath('/dashboard/ledger')
    redirect('/dashboard/ledger')
}
