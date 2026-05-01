export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export interface FoodEntry {
  id: string; date: string; timestamp: string; name: string; portion: string
  calories: number; protein: number; carbs: number; fat: number
  mealType: MealType; source: 'manual'|'scan'|'recipe'; imageData?: string
}
export interface DailyTotals { calories:number; protein:number; carbs:number; fat:number; entries:number }
const LP = 'napp_log_'
function today(): string { return new Date().toISOString().slice(0,10) }
function getLog(d: string): FoodEntry[] {
  if(typeof window==='undefined') return []
  try { return JSON.parse(localStorage.getItem(LP+d)??'[]') } catch { return [] }
}
function saveLog(d: string, e: FoodEntry[]): void {
  try { localStorage.setItem(LP+d, JSON.stringify(e)) } catch(err) { console.warn(err) }
}
export function addEntry(e: Omit<FoodEntry,'id'|'date'|'timestamp'>, date?: string): FoodEntry {
  const d=date??today(), entries=getLog(d)
  const full: FoodEntry = { ...e, id:Date.now().toString(36)+Math.random().toString(36).slice(2), date:d, timestamp:new Date().toISOString() }
  entries.push(full); saveLog(d,entries); return full
}
export function removeEntry(id: string, date?: string): void { const d=date??today(); saveLog(d,getLog(d).filter(e=>e.id!==id)) }
export function getDailyLog(d: string): FoodEntry[] { return getLog(d) }
export function getTodayLog(): FoodEntry[] { return getLog(today()) }
export function getDailyTotals(d: string): DailyTotals {
  return getLog(d).reduce((a,e)=>({ calories:a.calories+e.calories, protein:a.protein+e.protein, carbs:a.carbs+e.carbs, fat:a.fat+e.fat, entries:a.entries+1 }),{ calories:0,protein:0,carbs:0,fat:0,entries:0 })
}
export function getLast7Days(): string[] {
  return Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().slice(0,10) })
}
