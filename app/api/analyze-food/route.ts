import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, mimeType = 'image/jpeg' } = body

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '')

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Analyze this food image and provide nutritional estimates. Return ONLY valid JSON (no markdown):
{
  "name": "Food name",
  "portion": "Estimated portion size (e.g. '1 cup', '200g')",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "confidence": "high"|"medium"|"low",
  "notes": "Brief note about the estimate",
  "alternatives": [
    {"name": "Alternative if portion is larger", "calories": number, "protein": number, "carbs": number, "fat": number}
  ]
}
Be realistic. If the image is unclear, set confidence to "low" and give a reasonable estimate.`
            }
          ]
        }
      ]
    })

    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    let analysis
    try {
      const cleaned = textContent.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysis = JSON.parse(cleaned)
    } catch {
      throw new Error('Failed to parse nutrition JSON from Claude response')
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Food analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze food image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
