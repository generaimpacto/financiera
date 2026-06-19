import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Devuelve la comisión generada / cobrada / pendiente de un cliente (solo admin).
export async function GET(req: NextRequest) {
    const clientId = req.nextUrl.searchParams.get('clientId') || ''
    if (!clientId) return NextResponse.json({ error: 'clientId requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 })

    const { data: client } = await supabase.from('profiles').select('commission_percentage').eq('id', clientId).single()
    const pct = Number(client?.commission_percentage) || 0

    const { data: payments } = await supabase.from('payments').select('amount').eq('user_id', clientId)
    const income = (payments || []).reduce((a, p) => a + Number(p.amount), 0)
    const generated = (income * pct) / 100

    const { data: commissionExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', clientId)
        .eq('is_commission_payment', true)
    const paid = (commissionExpenses || []).reduce((a, e) => a + Number(e.amount), 0)

    const pending = generated - paid
    return NextResponse.json({ pct, generated, paid, pending })
}
