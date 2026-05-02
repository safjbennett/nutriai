'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { getCurrentUser } from '@/lib/storage'
import { UserProfile, NutritionPlan, Recipe } from '@/lib/types'
import { calculateNutritionPlan } from '@/lib/calculations'
import { addEntry } from '@/lib/food-log'

export default function RecipesPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [plan, setPlan] = useState<NutritionPlan | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [trending, setTrending] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'search'|'trending'>('search')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [addedToLog, setAddedToLog] = useState<string | null>(null)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.push('/'); return }
    setUser(u)
    if (u.age && u.weightKg && u.heightCm) {
      const p = calculateNutritionPlan(u)
      setPlan(p)
    }
  }, [router])

  const searchRecipes = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const prefs = localStorage.getItem(`napp_prefs_${user.id}`)
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: prefs ? JSON.parse(prefs) : null,
          nutritionPlan: plan,
          query: searchQuery || 'healthy balanced meals'
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load recipes')
      setRecipes(data.recipes || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [user, plan, searchQuery])

  const loadTrending = useCallback(async () => {
    if (!user) return
    setTrendingLoading(true)
    setError('')
    try {
      const prefs = localStorage.getItem(`napp_prefs_${user.id}`)
      const res = await fetch('/api/trending-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: prefs ? JSON.parse(prefs) : null,
          nutritionPlan: plan
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load trending')
      setTrending(data.recipes || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setTrendingLoading(false)
    }
  }, [user, plan])

  useEffect(() => {
    if (activeTab === 'trending' && trending.length === 0 && user) {
      loadTrending()
    }
  }, [activeTab, user, trending.length, loadTrending])

  useEffect(() => {
    if (user) searchRecipes()
  }, [user]) // eslint-disable-line

  function addToLog(recipe: Recipe) {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    addEntry(user.id, today, {
      name: recipe.name,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      portion: '1 serving',
      mealType: 'lunch'
    })
    setAddedToLog(recipe.id)
    setTimeout(() => setAddedToLog(null), 2000)
  }

  const displayRecipes = activeTab === 'trending' ? trending : recipes
  const isLoading = activeTab === 'trending' ? trendingLoading : loading

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recipes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">AI-powered recipes tailored to your goals</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'search' ? 'bg-brand-600 text-white shadow' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              🔍 Search Recipes
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'trending' ? 'bg-brand-600 text-white shadow' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              🔥 Trending
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white">Hot</span>
            </button>
          </div>

          {activeTab === 'search' && (
            <div className="flex gap-3 mb-8">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchRecipes()}
                placeholder="Search recipes (e.g. 'high protein breakfast', 'low carb dinner')..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={searchRecipes}
                disabled={loading}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
              >
                {loading ? '⏳' : '🔍'} Search
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'trending' ? '🔥 Finding viral recipes...' : '🤖 AI is generating recipes...'}
              </p>
            </div>
          )}

          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayRecipes.map(recipe => (
                <div key={recipe.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img
                      src={recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                      alt={recipe.name}
                      className="w-full h-48 object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' }}
                    />
                    {recipe.viralNote && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        🔥 {recipe.viralNote}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {recipe.difficulty || 'Medium'}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{recipe.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{recipe.description}</p>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { label: 'Cal', value: recipe.calories, color: 'text-orange-600 dark:text-orange-400' },
                        { label: 'Protein', value: `${recipe.protein}g`, color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Carbs', value: `${recipe.carbs}g`, color: 'text-yellow-600 dark:text-yellow-400' },
                        { label: 'Fat', value: `${recipe.fat}g`, color: 'text-red-600 dark:text-red-400' },
                      ].map(m => (
                        <div key={m.label} className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                          <div className={`font-bold text-sm ${m.color}`}>{m.value}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <span>⏱ {recipe.prepTime + recipe.cookTime} min</span>
                      <span>👤 {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                      {recipe.platform && <span>📱 {recipe.platform}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedRecipe(recipe)}
                        className="flex-1 py-2 border border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-400 rounded-lg text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                      >
                        View Recipe
                      </button>
                      <button
                        onClick={() => addToLog(recipe)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${addedToLog === recipe.id ? 'bg-green-500 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'}`}
                      >
                        {addedToLog === recipe.id ? '✓ Added!' : '+ Log It'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && displayRecipes.length === 0 && !error && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-5xl mb-4">🍽️</div>
              <p>No recipes yet. {activeTab === 'search' ? 'Search above to get started.' : 'Loading trending recipes...'}</p>
            </div>
          )}
        </div>
      </main>

      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecipe(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <img
              src={selectedRecipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'}
              alt={selectedRecipe.name}
              className="w-full h-56 object-cover rounded-t-2xl"
              onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80' }}
            />
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRecipe.name}</h2>
                <button onClick={() => setSelectedRecipe(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{selectedRecipe.description}</p>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Calories', value: selectedRecipe.calories, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
                  { label: 'Protein', value: `${selectedRecipe.protein}g`, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
                  { label: 'Carbs', value: `${selectedRecipe.carbs}g`, color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' },
                  { label: 'Fat', value: `${selectedRecipe.fat}g`, color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
                ].map(m => (
                  <div key={m.label} className={`rounded-xl p-3 text-center ${m.color}`}>
                    <div className="font-bold text-lg">{m.value}</div>
                    <div className="text-xs opacity-80">{m.label}</div>
                  </div>
                ))}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Ingredients</h3>
              <ul className="space-y-1 mb-6">
                {selectedRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full flex-shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Instructions</h3>
              <ol className="space-y-3 mb-6">
                {selectedRecipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => { addToLog(selectedRecipe); setSelectedRecipe(null) }}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors"
              >
                + Add to Today&apos;s Food Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
