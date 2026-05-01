'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, CheckCircle, Check } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getCurrentUser, getFoodPreferences, saveFoodPreferences } from '@/lib/storage'
import type { FoodPreferences } from '@/lib/types'
const FL = {
  proteins:['Chicken Breast','Chicken Thighs','Lean Beef','Salmon','Tuna','Cod','Eggs','Greek Yogurt','Cottage Cheese','Tofu','Tempeh','Shrimp','Turkey Breast','Lean Pork','Lentils'],
  carbs:['Brown Rice','White Rice','Oats','Quinoa','Sweet Potato','Whole Wheat Pasta','Bread','Potatoes','Barley','Couscous'],
  fruits:['Banana','Apple','Blueberries','Strawberries','Mango','Avocado','Orange','Grapes','Watermelon'],
  vegetables:['Broccoli','Spinach','Kale','Bell Peppers','Zucchini','Cucumber','Tomatoes','Mushrooms','Asparagus','Carrots','Cauliflower'],
}
const DR=['Vegetarian','Vegan','Gluten-Free','Dairy-Free','Keto','Paleo','Halal','Kosher','Nut-Free','Low-FODMAP']
type Cat=keyof typeof FL
export default function PreferencesPage() {
  const router=useRouter()
  const [tab,setTab]=useState<Cat>('proteins')
  const [prefs,setPrefs]=useState<FoodPreferences>({proteins:[],carbs:[],fruits:[],vegetables:[],dietaryRestrictions:[]})
  const [userId,setUserId]=useState(''),[saved,setSaved]=useState(false)
  useEffect(()=>{ const u=getCurrentUser(); if(!u){router.replace('/');return}; setUserId(u.id); setPrefs(getFoodPreferences(u.id)) },[router])
  const toggle=(c:Cat,item:string)=>setPrefs(p=>({...p,[c]:p[c].includes(item)?p[c].filter(x=>x!==item):[...p[c],item]}))
  const toggleR=(item:string)=>setPrefs(p=>({...p,dietaryRestrictions:p.dietaryRestrictions.includes(item)?p.dietaryRestrictions.filter(x=>x!==item):[...p.dietaryRestrictions,item]}))
  const handleSave=()=>{ if(!userId)return; saveFoodPreferences(userId,prefs); setSaved(true); setTimeout(()=>setSaved(false),2500) }
  const tabs=[{key:'proteins' as Cat,label:'Proteins',emoji:'🥩'},{key:'carbs' as Cat,label:'Carbs',emoji:'🍚'},{key:'fruits' as Cat,label:'Fruits',emoji:'🍎'},{key:'vegetables' as Cat,label:'Vegetables',emoji:'🥦'}]
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950"><Navigation/>
      <main className="flex-1 pt-14 lg:pt-0 pb-24 lg:pb-0 px-4 lg:px-8 py-6 max-w-3xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Food Preferences</h1><p className="text-slate-400 text-sm">Select foods you enjoy</p></div>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">{saved?<CheckCircle className="w-4 h-4"/>:<Save className="w-4 h-4"/>}{saved?'Saved!':'Save'}</button>
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {tabs.map(({key,label,emoji})=>{const count=prefs[key].length;return(
            <button key={key} onClick={()=>setTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${tab===key?'bg-brand-500 text-white':'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {emoji} {label}{count>0&&<span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab===key?'bg-white/20 text-white':'bg-brand-100 dark:bg-brand-900/30 text-brand-600'}`}>{count}</span>}
            </button>
          )})}
        </div>
        <div className="card mb-4"><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FL[tab].map(item=>{const sel=prefs[tab].includes(item);return(
            <button key={item} onClick={()=>toggle(tab,item)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${sel?'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700':'border-slate-200 dark:border-slate-700'}`}>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${sel?'bg-brand-500':'bg-slate-100 dark:bg-slate-700'}`}>{sel&&<Check className="w-3 h-3 text-white"/>}</div>{item}
            </button>
          )})}
        </div></div>
        <div className="card"><h2 className="font-semibold mb-3">Dietary Restrictions</h2><div className="flex flex-wrap gap-2">
          {DR.map(item=>{const sel=prefs.dietaryRestrictions.includes(item);return(
            <button key={item} onClick={()=>toggleR(item)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${sel?'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700':'border-slate-200 dark:border-slate-700'}`}>{sel&&'✓ '}{item}</button>
          )})}
        </div></div>
      </main>
    </div>
  )
}
