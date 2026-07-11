import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { apiKey: clientApiKey, ...pixelLabBody } = body

    const apiKey = clientApiKey || process.env.PIXELLAB_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 })
    }

    // El body ya viene limpio desde el front (snake_case, image_size, etc)
    const response = await fetch('https://api.pixellab.ai/v1/animate-with-text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pixelLabBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || 'PixelLab API Error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
