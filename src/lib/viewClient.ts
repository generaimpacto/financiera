import { cookies } from 'next/headers'

export const VIEW_CLIENT_COOKIE = 'gi_view_client'

/**
 * Devuelve el id del cliente que el admin está "viendo" (cookie del switcher).
 * Cadena vacía = vista global (Admin). Solo aplica para admins.
 */
export async function getViewClientId(): Promise<string> {
    const c = await cookies()
    const v = c.get(VIEW_CLIENT_COOKIE)?.value || ''
    return v === 'all' ? '' : v
}
