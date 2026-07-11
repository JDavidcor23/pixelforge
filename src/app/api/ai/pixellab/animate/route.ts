import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const {
      description,
      action,
      direction,
      width = 64,
      height = 64,
      referenceBase64,
      nFrames = 4,
      apiKey: clientApiKey,
    } = await req.json()

    const apiKey = clientApiKey || process.env.PIXELLAB_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 })
    }

    // Construimos el body exacto para PixelLab
    const pixelLabBody: any = {
      description,
      action: action || 'walk',
      view: 'side',
      direction: direction || 'south',
      image_size: {
        width: 64, // Forzamos 64 como pide la doc
        height: 64,
      },
      n_frames: nFrames,
    }

    // Solo incluimos reference_image si realmente hay una
    if (referenceBase64) {
      pixelLabBody.reference_image = {
        type: 'base64',
        base64: referenceBase64.startsWith('data:') 
          ? referenceBase64 
          : `data:image/png;base64,${referenceBase64}`,
      }
    }

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
