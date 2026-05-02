export type Gender = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type Goal = 'lose_weight' | 'maintain' | 'bulk'
export type WeightLossRate = 'slow' | 'moderate' | 'fast'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface UserProfile {
  id: string; name: string; email: string; passwordHash: string
  age: number; gender: Gender; weightKg: number; heightCm: number; targetWeightKg: number
  activityLevel: ActivityLevel; goal: Goal; weightLossRate?: WeightLossRate
  createdAt: string; updatedAt: string
}

export interface NutritionPlan {
  bmr: number; tdee: number; targetCalories: number
  calories: number
  protein: number; carbs: number; fat: number
  bmi: number; bmiCategory: string; weeksToGoal: number | null
}

export interface FoodEntry {
  id: string; date: string; timestamp: string; name: string; portion: string
  calories: number; protein: number; carbs: number; fat: number
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  source: 'manual' | 'scan' | 'recipe'; imageData?: string
}

export interface DailyTotals { calories: number; protein: number; carbs: number; fat: number; entries: number }

export interface Recipe {
  id: string; name: string; description: string
  calories: number; protein: number; carbs: number; fat: number
  servings: number; prepTime: number; cookTime: number
  ingredients: string[]; instructions: string[]; tags: string[]
  mealType: MealType; image?: string; viral?: boolean; viralNote?: string
  platform?: string; difficulty?: string
}

export interface FoodPreferences {
  proteins: string[]; carbs: string[]; fruits: string[]; vegetables: string[]
  dietaryRestrictions: string[]; favoriteCuisines?: string[]; allergies?: string[]
}

export interface Session { userId: string; expiresAt: string }

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little/no exercise)', light: 'Lightly active (1-3 days/week)',
  moderate: 'Moderately active (3-5 days/week)', active: 'Very active (6-7 days/week)',
  very_active: 'Extra active (physical job)'
}
export const GOAL_LABELS: Record<Goal, string> = { lose_weight: 'Lose Weight', maintain: 'Maintain Weight', bulk: 'Build Muscle' }
export const WEIGHT_LOSS_LABELS: Record<WeightLossRate, string> = { slow: 'Slow (0.25kg/week)', moderate: 'Moderate (0.5kg/week)', fast: 'Fast (1kg/week)' }
