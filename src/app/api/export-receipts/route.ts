import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import JSZip from 'jszip'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return new NextResponse('No autorizado', { status: 401 })
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
        return new NextResponse('Faltan fechas de inicio y fin', { status: 400 })
    }

    try {
        // Busca pagos en el rango de fechas que tengan recibo
        const { data: payments, error } = await supabase
            .from('payments')
            .select('id, client_name, payment_date, receipt_url')
            .gte('payment_date', start)
            .lte('payment_date', end)
            .not('receipt_url', 'is', null)

        if (error) throw error

        if (!payments || payments.length === 0) {
            return new NextResponse('No se encontraron comprobantes en este rango', { status: 404 })
        }

        const zip = new JSZip()
        const folder = zip.folder(`comprobantes_${start}_al_${end}`)

        // Descarga y añade cada recibo al zip
        const downloadPromises = payments.map(async (payment) => {
            // La URL puede ser pública completa (https://...) o relative, dependiendo de cómo guardamos
            // Fetch normal para descargar la imagen
            try {
                const response = await fetch(payment.receipt_url)
                const arrayBuffer = await response.arrayBuffer()

                // Determinar extensión basándose en la url o asumiendo jpg
                const urlObj = new URL(payment.receipt_url)
                const extensionMatch = urlObj.pathname.match(/\.[0-9a-z]+$/i)
                const extension = extensionMatch ? extensionMatch[0] : '.jpg'

                // Nombre del archivo dentro del zip: "Fecha_NombreCliente.jpg"
                const finalName = `${payment.payment_date}_${payment.client_name.replace(/[^a-z0-9]/gi, '_')}${extension}`

                folder?.file(finalName, arrayBuffer)
            } catch (err) {
                console.error(`No se pudo descargar comprobante para pago ${payment.id}`)
            }
        })

        await Promise.all(downloadPromises)

        // Generar el ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' })

        // Retornamos el ZIP al cliente
        return new Response(zipBlob, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="comprobantes_${start}_al_${end}.zip"`,
            },
        })
    } catch (error: any) {
        console.error(error)
        return new NextResponse(error.message || 'Error interno del servidor', { status: 500 })
    }
}
