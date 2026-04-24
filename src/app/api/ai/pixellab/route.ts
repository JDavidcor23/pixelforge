import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt, width = 64, height = 64 } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const apiKey = process.env.PIXELLAB_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing PIXELLAB_API_KEY in environment variables' },
        { status: 500 }
      )
    }

    // For Pixflux, dimensions must be at least 32x32 based on docs.
    // We override to 128x128 as per user preference for standard high-quality output.
    const requestWidth = Math.max(32, width || 128)
    const requestHeight = Math.max(32, height || 128)

    // Call PixelLab API
    const response = await fetch('https://api.pixellab.ai/v1/generate-image-pixflux', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: prompt,
        image_size: { width: requestWidth, height: requestHeight },
        no_background: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('PixelLab API Error:', errorData)
      return NextResponse.json(
        { error: errorData.message || 'Failed to generate image from PixelLab API' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // PixelLab API returns { image: { type: "base64", base64: "data:image/png;base64,..." }, usage: { ... } }
    if (!data.image?.base64) {
      return NextResponse.json({ error: 'Invalid response from PixelLab API' }, { status: 500 })
    }

    // Return the base64 string directly
    return NextResponse.json({ base64: data.image.base64 })
  } catch (error: any) {
    console.error('API /api/ai/pixellab error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
