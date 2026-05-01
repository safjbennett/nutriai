'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ScanLine, BookOpen, User, Utensils, Target, Zap, TrendingUp, Scale } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getCurrentUser } from '@/lib/storage'
import { calcNutritionPlan } from '@/lib/calculations'
import { getDailyTotals } from '@/lib/food-log'
import type { NutritionPlan } from '@/lib/types'
export default function Dashboard() {
  const router=useRouter()
  const [user,setUser]=useState<ReturnType<typeof getCurrentUser>>(null)
  const [plan,setPlan]=useState<NutritionPlan|null>(null)
  const [tot,setTot]=useState({calories:0,protein:0,carbs:0,fat:0,entries:0})
  const [greeting,setGreeting]=useState('Good day')
  useEffect(()=>{
    const u=getCurrentUser(); if(!u){router.replace('/');return}
    setUser(u); setPlan(calcNutritionPlan(u)); setTot(getDailyTotals(new Date().toISOString().slice(0,10)))
    const h=new Date().getHours(); setGreeting(h<12?'Good morning':h<17?'Good afternoon':'Good evening')
  },[router])
  if(!user||!plan) return null
  const calPct=Math.min(100,Math.round((tot.calories/plan.targetCalories)*100))
  const remaining=Math.max(0,plan.targetCalories-tot.calories)
  function Ring({value,max,color,label}:{value:number;max:number;color:string;label:string}){
    const r=28,circ=2*Math.PI*r,pct=Math.min(1,max>0?value/max:0)
    return <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="-rotate-90 w-full h-full">
          <circle cx="32" cy="32" r={r} fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="6"/>
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${pct*circ} ${circ}`} strokeLinecap="round" className="transition-all duration-700"/>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{Math.round(pct*100)}%</span>
      </div>
      <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-xs font-semibold">{value}g</span>
    </div>
  }
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation/>
      <main className="flex-1 pt-14 lg:pt-0 pb-24 lg:pb-0 px-4 lg:px-8 py-6 max-w-4xl mx-auto w-full">
        <div className="mb-6"><h1 className="text-2xl font-bold">{greeting}, {user.name.split(' ')[0]} 👋</h1><p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Here's your nutrition summary for today</p></div>
        <div className="card mb-4">
          <div className="flex items-start justify-between mb-4">
            <div><p className="text-sm text-slate-500 dark:text-slate-400">Calories Today</p><p className="text-3xl font-bold">{tot.calories.toLocaleString()}</p><p className="text-sm text-slate-400">of {plan.targetCalories.toLocaleString()} kcal goal</p></div>
            <div className="text-right"><p className="text-sm text-slate-500 dark:text-slate-400">Remaining</p><p className={`text-2xl font-bold ${remaining===0?'text-red-500':'text-brand-500'}`}>{remaining.toLocaleString()}</p><p className="text-xs text-slate-400">kcal left</p></div>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${calPct>=100?'bg-red-400':'gradient-brand'}`} style={{width:`${calPct}%`}}/></div>
          <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0</span><span>{calPct}%</span><span>{plan.targetCalories.toLocaleString()}</span></div>
        </div>
        <div className="card mb-4">
          <h3 className="font-semibold mb-4">Macros Today</h3>
          <div className="flex justify-around">
            <Ring value={tot.protein} max={plan.protein} color="#10b981" label="Protein"/>
            <Ring value={tot.carbs} max={plan.carbs} color="#3b82f6" label="Carbs"/>
            <Ring value={tot.fat} max={plan.fat} color="#f59e0b" label="Fat"/>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs text-slate-400"><div>Target: {plan.protein}g</div><div>Target: {plan.carbs}g</div><div>Target: {plan.fat}g</div></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[{icon:Target,label:'Daily Target',value:`${plan.targetCalories} kcal`,color:'text-brand-500'},{icon:Zap,label:'TDEE',value:`${plan.tdee} kcal`,color:'text-yellow-500'},{icon:TrendingUp,label:'BMI',value:`${plan.bmi} · ${plan.bmiCategory}`,color:'text-blue-500'},{icon:Scale,label:'Goal',value:plan.weeksToGoal?`${plan.weeksToGoal} wks`:'Maintain',color:'text-purple-500'}].map(({icon:Icon,label,value,color})=>(
            <div key={label} className="card p-4"><Icon className={`w-5 h-5 mb-2 ${color}`}/><p className="text-xs text-slate-400">{label}</p><p className="font-semibold text-sm mt-0.5">{value}</p></div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[{href:'/scan',icon:ScanLine,label:'Scan Food',sub:'AI macro analysis',gradient:true},{href:'/food-log',icon:BookOpen,label:'Food Log',sub:`${tot.entries} items today`},{href:'/recipes',icon:Utensils,label:'Find Recipes',sub:'Personalised for you'},{href:'/profile',icon:User,label:'My Profile',sub:'Update your goals'}].map(({href,icon:Icon,label,sub,gradient})=>(
            <Link key={href} href={href} className={`card p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform cursor-pointer ${gradient?'gradient-brand text-white border-0':''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${gradient?'bg-white/20':'bg-brand-50 dark:bg-brand-900/20'}`}><Icon className={`w-5 h-5 ${gradient?'text-white':'text-brand-500'}`}/></div>
              <div><p className={`font-semibold text-sm ${gradient?'text-white':''}`}>{label}</p><p className={`text-xs ${gradient?'text-white/70':'text-slate-400'}`}>{sub}</p></div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
