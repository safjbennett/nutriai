import { FoodEntry, DailyTotals } from './types'

const LP = 'napp_log_'

function getLog(date: string): FoodEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LP + date) ?? '[]') } catch { return [] }
}

function saveLog(date: string, entries: FoodEntry[]): void {
  try { localStorage.setItem(LP + date, JSON.stringify(entries)) } catch (err) { console.warn(err) }
}

export function addEntry(
  userId: string,
  date: string,
  data: { name: string; calories: number; protein: number; carbs: number; fat: number; portion: string; mealType: 'breakfast'|'lunch'|'dinner'|'snack' }
): FoodEntry {
  const entries = getLog(date)
  const entry: FoodEntry = {
    ...data,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    date,
    timestamp: new Date().toISOString(),
    source: 'manual'
  }
  entries.push(entry)
  saveLog(date, entries)
  return entry
}

export function removeEntry(userId: string, date: string, entryId: string): void {
  saveLog(date, getLog(date).filter(e => e.id !== entryId))
}

// Accepts (userId, date) or just (date) — userId is ignored, data keyed by date
export function getDayLog(userIdOrDate: string, date?: string): FoodEntry[] {
  return getLog(date ?? userIdOrDate)
}

// Accepts (userId, date) or just (date)
export function getDailyTotals(userIdOrDate: string, date?: string): DailyTotals {
  return getLog(date ?? userIdOrDate).reduce(
    (a, e) => ({ calories: a.calories + e.calories, protein: a.protein + e.protein, carbs: a.carbs + e.carbs, fat: a.fat + e.fat, entries: a.entries + 1 }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 }
  )
}

export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10)
  })
}
