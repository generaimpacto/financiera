import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ isAdmin: false, clients: [] })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    if (!isAdmin) {
        return NextResponse.json({ isAdmin: false, clients: [] })
    }

    const { data: clients } = await supabase
        .from('profiles')
        .select('id, business_name')
        .eq('role', 'user')
        .order('business_name', { ascending: true })

    return NextResponse.json({
        isAdmin: true,
        clients: clients || []
    })
}
