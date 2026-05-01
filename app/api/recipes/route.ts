import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { preferences, nutritionPlan, query } = body

    const dietaryText = preferences?.dietaryRestrictions?.length
      ? `Dietary restrictions: ${preferences.dietaryRestrictions.join(', ')}.`
      : ''
    const cuisineText = preferences?.favoriteCuisines?.length
      ? `Preferred cuisines: ${preferences.favoriteCuisines.join(', ')}.`
      : ''
    const allergiesText = preferences?.allergies?.length
      ? `Allergies to avoid: ${preferences.allergies.join(', ')}.`
      : ''
    const goalText = nutritionPlan
      ? `Daily targets: ${nutritionPlan.calories} kcal, ${nutritionPlan.protein}g protein, ${nutritionPlan.carbs}g carbs, ${nutritionPlan.fat}g fat.`
      : ''

    const searchQuery = query || 'healthy balanced meals'

    const prompt = `You are a professional nutritionist and chef. Generate exactly 4 recipes matching this search: "${searchQuery}".

${dietaryText} ${cuisineText} ${allergiesText} ${goalText}

Return ONLY a valid JSON array (no markdown, no explanation) with exactly 4 recipe objects. Each object must have:
{
  "id": "unique-string",
  "name": "Recipe Name",
  "description": "2-sentence description",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "servings": number,
  "prepTime": number,
  "cookTime": number,
  "difficulty": "Easy"|"Medium"|"Hard",
  "tags": ["tag1","tag2"],
  "ingredients": ["1 cup item","2 tbsp item"],
  "instructions": ["Step 1 text","Step 2 text"],
  "image": "https://images.unsplash.com/photo-[relevant-food-photo]?w=400&q=80"
}`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })

    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    let recipes
    try {
      const cleaned = textContent.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      recipes = JSON.parse(cleaned)
    } catch {
      throw new Error('Failed to parse recipe JSON from Claude response')
    }

    return NextResponse.json({ recipes })
  } catch (error) {
    console.error('Recipe API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recipes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
