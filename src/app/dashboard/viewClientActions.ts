'use server'

import { cookies } from 'next/headers'
import { VIEW_CLIENT_COOKIE } from '@/lib/viewClient'

/** Setea (o limpia) el cliente que el admin está viendo. */
export async function setViewClientAction(clientId: string) {
    const c = await cookies()
    if (!clientId || clientId === 'all') {
        c.delete(VIEW_CLIENT_COOKIE)
    } else {
        c.set(VIEW_CLIENT_COOKIE, clientId, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
        })
    }
}
