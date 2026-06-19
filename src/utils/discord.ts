const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1479291198756622500/tmpn3ifT5B6LH7gTmFBtSWGPlU0zleG2K4F8lF_vx16eTUgSp-1mwg8pxO5K1dzwwvwh'

export async function sendDiscordNotification(message: string) {
    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: message,
                username: 'Finanzas Pro',
            }),
            signal: AbortSignal.timeout(3000),
        })
    } catch (error) {
        // Silently fail - notifications should not block the main flow
        console.error('Discord notification error:', error)
    }
}

export function formatCurrencyForNotification(amount: number): string {
    return '$ ' + Math.round(amount).toLocaleString('es-AR')
}
