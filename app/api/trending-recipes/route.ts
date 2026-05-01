import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { preferences, nutritionPlan } = body

    const dietaryText = preferences?.dietaryRestrictions?.length
      ? `Dietary restrictions: ${preferences.dietaryRestrictions.join(', ')}.`
      : ''

    let searchContext = ''

    // Try Brave Search if configured
    const braveKey = process.env.BRAVE_SEARCH_API_KEY
    if (braveKey) {
      try {
        const searchRes = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=viral+trending+healthy+recipes+2024+TikTok+Instagram&count=5`,
          {
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip',
              'X-Subscription-Token': braveKey
            }
          }
        )
        if (searchRes.ok) {
          const searchData = await searchRes.json()
          const results = searchData.web?.results?.slice(0, 5) || []
          searchContext = results.map((r: {title:string;description:string}) => `- ${r.title}: ${r.description}`).join('\n')
        }
      } catch (e) {
        console.log('Brave search failed, using Claude knowledge:', e)
      }
    }

    const prompt = `You are a food trend expert who tracks viral recipes on TikTok, Instagram, and YouTube.

${searchContext ? `Recent trending recipe context:\n${searchContext}\n\n` : ''}
Generate exactly 5 viral/trending recipes that are currently popular on social media.
${dietaryText}
${nutritionPlan ? `Target nutrition: ~${nutritionPlan.calories} kcal/day, ${nutritionPlan.protein}g protein.` : ''}

Return ONLY valid JSON array with 5 recipe objects (no markdown):
[{
  "id": "unique-id",
  "name": "Viral Recipe Name",
  "description": "Why this is trending + what makes it special (2 sentences)",
  "viralNote": "Short viral hook e.g. '23M views on TikTok' or 'Blew up on Instagram Reels'",
  "platform": "TikTok"|"Instagram"|"YouTube"|"Multiple",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "servings": 1,
  "prepTime": number,
  "cookTime": number,
  "difficulty": "Easy"|"Medium"|"Hard",
  "tags": ["Viral","trending-tag"],
  "ingredients": ["ingredient list"],
  "instructions": ["step by step"],
  "image": "https://images.unsplash.com/photo-[relevant]?w=400&q=80"
}]`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 5000,
      messages: [{ role: 'user', content: prompt }]
    })

    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') throw new Error('No response')

    let recipes
    try {
      const cleaned = textContent.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      recipes = JSON.parse(cleaned)
    } catch {
      throw new Error('Failed to parse JSON')
    }

    return NextResponse.json({ recipes })
  } catch (error) {
    console.error('Trending recipes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending recipes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
