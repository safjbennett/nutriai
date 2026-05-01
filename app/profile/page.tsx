'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, CheckCircle } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getCurrentUser, updateUser } from '@/lib/storage'
import { calcNutritionPlan } from '@/lib/calculations'
import { ACTIVITY_LABELS, GOAL_LABELS, WEIGHT_LOSS_LABELS } from '@/lib/types'
import type { UserProfile, ActivityLevel, Goal, WeightLossRate } from '@/lib/types'
export default function ProfilePage() {
  const router=useRouter()
  const [saved,setSaved]=useState(false)
  const [profile,setProfile]=useState<Partial<UserProfile>>({})
  const [loading,setLoading]=useState(true)
  useEffect(()=>{ const u=getCurrentUser(); if(!u){router.replace('/');return}; setProfile(u); setLoading(false) },[router])
  function update(k: keyof UserProfile, v: unknown){ setProfile(p=>({...p,[k]:v})) }
  function handleSave(){ const u=getCurrentUser(); if(!u)return; updateUser(u.id,profile as Partial<UserProfile>); setSaved(true); setTimeout(()=>setSaved(false),2500) }
  const plan=profile.age&&profile.weightKg&&profile.heightCm?calcNutritionPlan(profile as UserProfile):null
  if(loading) return null
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation/>
      <main className="flex-1 pt-14 lg:pt-0 pb-24 lg:pb-0 px-4 lg:px-8 py-6 max-w-5xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">My Profile</h1><p className="text-slate-400 text-sm">Update your details to get accurate macro targets</p></div>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">{saved?<CheckCircle className="w-4 h-4"/>:<Save className="w-4 h-4"/>}{saved?'Saved!':'Save'}</button>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card"><h2 className="font-semibold mb-4">Personal Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Full Name</label><input className="input" value={profile.name??''} onChange={e=>update('name',e.target.value)}/></div>
                <div className="col-span-2"><label className="label">Email</label><input type="email" className="input" value={profile.email??''} onChange={e=>update('email',e.target.value)}/></div>
                <div><label className="label">Age</label><input type="number" className="input" min={16} max={100} value={profile.age??''} onChange={e=>update('age',+e.target.value)}/></div>
                <div><label className="label">Gender</label><select className="input" value={profile.gender??'male'} onChange={e=>update('gender',e.target.value)}><option value="male">Male</option><option value="female">Female</option></select></div>
              </div>
            </div>
            <div className="card"><h2 className="font-semibold mb-4">Body Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Weight (kg)</label><input type="number" className="input" step="0.1" value={profile.weightKg??''} onChange={e=>update('weightKg',+e.target.value)}/></div>
                <div><label className="label">Height (cm)</label><input type="number" className="input" value={profile.heightCm??''} onChange={e=>update('heightCm',+e.target.value)}/></div>
                <div><label className="label">Target Weight (kg)</label><input type="number" className="input" step="0.1" value={profile.targetWeightKg??''} onChange={e=>update('targetWeightKg',+e.target.value)}/></div>
              </div>
            </div>
            <div className="card"><h2 className="font-semibold mb-4">Activity Level</h2>
              <div className="space-y-2">{(Object.entries(ACTIVITY_LABELS) as [ActivityLevel,string][]).map(([k,v])=>(
                <label key={k} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${profile.activityLevel===k?'border-brand-400 bg-brand-50 dark:bg-brand-900/20':'border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}>
                  <input type="radio" name="activity" value={k} checked={profile.activityLevel===k} onChange={()=>update('activityLevel',k)}/><span className="text-sm">{v}</span>
                </label>
              ))}</div>
            </div>
            <div className="card"><h2 className="font-semibold mb-4">My Goal</h2>
              <div className="grid grid-cols-3 gap-3 mb-4">{(Object.entries(GOAL_LABELS) as [Goal,string][]).map(([k,v])=>(
                <button key={k} onClick={()=>update('goal',k)} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${profile.goal===k?'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300':'border-slate-200 dark:border-slate-700'}`}>{v}</button>
              ))}</div>
              {profile.goal==='lose_weight'&&<div><label className="label">Weight Loss Rate</label>
                <div className="grid grid-cols-3 gap-2">{(Object.entries(WEIGHT_LOSS_LABELS) as [WeightLossRate,string][]).map(([k,v])=>(
                  <button key={k} onClick={()=>update('weightLossRate',k)} className={`p-2 rounded-lg border text-xs font-medium transition-all ${profile.weightLossRate===k?'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700':'border-slate-200 dark:border-slate-700'}`}>{v}</button>
                ))}</div>
              </div>}
            </div>
          </div>
          <div className="space-y-4">
            <div className="card sticky top-6"><h2 className="font-semibold mb-4">Your Targets</h2>
              {plan?<div className="space-y-3">{[
                {label:'BMR',value:`${plan.bmr} kcal`,color:'bg-slate-100 dark:bg-slate-700'},
                {label:'TDEE',value:`${plan.tdee} kcal`,color:'bg-slate-100 dark:bg-slate-700'},
                {label:'Daily Target',value:`${plan.targetCalories} kcal`,color:'bg-brand-100 dark:bg-brand-900/30'},
                {label:'Protein',value:`${plan.protein}g`,color:'bg-emerald-50 dark:bg-emerald-900/20'},
                {label:'Carbs',value:`${plan.carbs}g`,color:'bg-blue-50 dark:bg-blue-900/20'},
                {label:'Fat',value:`${plan.fat}g`,color:'bg-yellow-50 dark:bg-yellow-900/20'},
                {label:'BMI',value:`${plan.bmi} (${plan.bmiCategory})`,color:'bg-slate-100 dark:bg-slate-700'},
                ...(plan.weeksToGoal!==null?[{label:'Est. Goal',value:`${plan.weeksToGoal} weeks`,color:'bg-purple-50 dark:bg-purple-900/20'}]:[]),
              ].map(({label,value,color})=>(
                <div key={label} className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${color}`}><span className="text-slate-500 dark:text-slate-400">{label}</span><span className="font-semibold">{value}</span></div>
              ))}</div>:<p className="text-slate-400 text-sm">Fill in your details to see targets</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}