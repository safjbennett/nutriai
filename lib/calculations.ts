import { UserProfile, NutritionPlan } from './types'

const AM = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }
const WLD = { slow: 275, moderate: 550, fast: 1100 }

export function calcBMR(p: Pick<UserProfile, 'gender'|'weightKg'|'heightCm'|'age'>): number {
  return p.gender === 'male'
    ? 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + 5
    : 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age - 161
}

export function calcTDEE(p: Pick<UserProfile, 'gender'|'weightKg'|'heightCm'|'age'|'activityLevel'>): number {
  return calcBMR(p) * AM[p.activityLevel]
}

export function calcBMI(w: number, h: number): number {
  const hm = h / 100; return w / (hm * hm)
}

export function bmiCategory(b: number): string {
  return b < 18.5 ? 'Underweight' : b < 25 ? 'Normal' : b < 30 ? 'Overweight' : 'Obese'
}

export function weeksToGoal(p: Pick<UserProfile, 'weightKg'|'targetWeightKg'|'goal'|'weightLossRate'>): number | null {
  if (p.goal === 'maintain') return null
  const d = Math.abs(p.weightKg - p.targetWeightKg)
  if (d < 0.5) return 0
  if (p.goal === 'lose_weight') {
    const r = p.weightLossRate === 'fast' ? 1 : p.weightLossRate === 'moderate' ? 0.5 : 0.25
    return Math.round(d / r)
  }
  return Math.round(d / 0.25)
}

export function calcNutritionPlan(p: UserProfile): NutritionPlan {
  const bmr = Math.round(calcBMR(p))
  const tdee = Math.round(calcTDEE(p))
  const bmi = Math.round(calcBMI(p.weightKg, p.heightCm) * 10) / 10
  let tc = p.goal === 'lose_weight'
    ? Math.max(1200, tdee - WLD[p.weightLossRate ?? 'moderate'])
    : p.goal === 'bulk' ? tdee + 300 : tdee
  tc = Math.round(tc)
  const [pp, cp, fp] = p.goal === 'lose_weight' ? [0.40, 0.30, 0.30]
    : p.goal === 'bulk' ? [0.30, 0.50, 0.20] : [0.30, 0.40, 0.30]
  return {
    bmr, tdee, targetCalories: tc, calories: tc,
    protein: Math.round(tc * pp / 4),
    carbs: Math.round(tc * cp / 4),
    fat: Math.round(tc * fp / 9),
    bmi, bmiCategory: bmiCategory(bmi), weeksToGoal: weeksToGoal(p)
  }
}

export const calculateNutritionPlan = calcNutritionPlan
