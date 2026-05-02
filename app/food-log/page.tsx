'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { getCurrentUser } from '@/lib/storage'
import { UserProfile, NutritionPlan, FoodEntry, MealType } from '@/lib/types'
import { calculateNutritionPlan } from '@/lib/calculations'
import { getDayLog, addEntry, removeEntry, getDailyTotals } from '@/lib/food-log'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_ICONS: Record<MealType, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }
const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' }

export default function FoodLogPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [plan, setPlan] = useState<NutritionPlan | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeMeal, setActiveMeal] = useState<MealType>('lunch')
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', portion: '1 serving' })
  const [formError, setFormError] = useState('')

  const refresh = useCallback((uid: string, date: string) => {
    const log = getDayLog(uid, date)
    setEntries(log)
    setTotals(getDailyTotals(uid, date))
  }, [])

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.push('/'); return }
    setUser(u)
if (u.age && u.weightKg && u.heightCm) setPlan(calculateNutritionPlan(u))
    refresh(u.id, selectedDate)
  }, [router, refresh, selectedDate])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!form.name || !form.calories) { setFormError('Name and calories are required'); return }
    addEntry(user.id, selectedDate, {
      name: form.name,
      calories: Number(form.calories),
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      portion: form.portion,
      mealType: activeMeal
    })
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', portion: '1 serving' })
    setShowAddForm(false)
    setFormError('')
    refresh(user.id, selectedDate)
  }

  function handleRemove(entryId: string) {
    if (!user) return
    removeEntry(user.id, selectedDate, entryId)
    refresh(user.id, selectedDate)
  }

  const caloriePercent = plan ? Math.min(100, Math.round((totals.calories / plan.calories) * 100)) : 0
  const remaining = plan ? plan.calories - totals.calories : 0

  const dateStr = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Food Log</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{dateStr}</p>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Daily Summary Card */}
          {plan && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{totals.calories}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">of {plan.calories} kcal</div>
                </div>
                <div className={`text-right ${remaining >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-red-500'}`}>
                  <div className="text-2xl font-bold">{Math.abs(remaining)}</div>
                  <div className="text-sm">{remaining >= 0 ? 'remaining' : 'over'}</div>
                </div>
              </div>

              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-5">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${caloriePercent >= 100 ? 'bg-red-500' : caloriePercent >= 80 ? 'bg-yellow-500' : 'bg-brand-500'}`}
                  style={{ width: `${caloriePercent}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Protein', eaten: totals.protein, target: plan.protein, color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Carbs', eaten: totals.carbs, target: plan.carbs, color: 'bg-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400' },
                  { label: 'Fat', eaten: totals.fat, target: plan.fat, color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-medium ${m.textColor}`}>{m.label}</span>
                      <span className="text-gray-500 dark:text-gray-400">{m.eaten}g / {m.target}g</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${m.color} transition-all`}
                        style={{ width: `${Math.min(100, (m.eaten / m.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Food Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 mb-6 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span className="text-xl">+</span> Add Food
          </button>

          {/* Add Food Form */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Food</h3>

                {/* Meal selector */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {MEAL_TYPES.map(m => (
                    <button
                      key={m}
                      onClick={() => setActiveMeal(m)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeMeal === m ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    >
                      {MEAL_ICONS[m]} {MEAL_LABELS[m]}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAdd} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Food name *"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Portion (e.g. 1 cup, 200g)"
                    value={form.portion}
                    onChange={e => setForm(f => ({ ...f, portion: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Calories *" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <input type="number" placeholder="Protein (g)" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <input type="number" placeholder="Carbs (g)" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <input type="number" placeholder="Fat (g)" value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  {formError && <p className="text-red-500 text-sm">{formError}</p>}
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-colors">Add</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Entries by meal */}
          {MEAL_TYPES.map(meal => {
            const mealEntries = entries.filter(e => e.mealType === meal)
            const mealCals = mealEntries.reduce((s, e) => s + e.calories, 0)
            return (
              <div key={meal} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span>{MEAL_ICONS[meal]}</span> {MEAL_LABELS[meal]}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{mealCals} kcal</span>
                </div>
                {mealEntries.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 text-center text-sm text-gray-400 dark:text-gray-500">
                    No {MEAL_LABELS[meal].toLowerCase()} logged
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mealEntries.map(entry => (
                      <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">{entry.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{entry.portion}</div>
                          <div className="flex gap-3 mt-1 text-xs">
                            <span className="text-orange-600 dark:text-orange-400">{entry.calories} kcal</span>
                            <span className="text-blue-600 dark:text-blue-400">P: {entry.protein}g</span>
                            <span className="text-yellow-600 dark:text-yellow-400">C: {entry.carbs}g</span>
                            <span className="text-red-600 dark:text-red-400">F: {entry.fat}g</span>
                          </div>
                        </div>
                        <button onClick={() => handleRemove(entry.id)} className="ml-3 text-gray-300 hover:text-red-500 transition-colors text-xl flex-shrink-0">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {entries.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <div className="text-4xl mb-3">📋</div>
              <p>No food logged yet today. Start by adding a meal!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
