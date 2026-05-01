'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Leaf, LayoutDashboard, BookOpen, ScanLine, User, Heart, Utensils, Sun, Moon, LogOut } from 'lucide-react'
import { clearSession, getCurrentUser } from '@/lib/storage'
import { useEffect, useState } from 'react'
const NAV=[{href:'/dashboard',icon:LayoutDashboard,label:'Dashboard'},{href:'/food-log',icon:BookOpen,label:'Food Log'},{href:'/scan',icon:ScanLine,label:'Scan Food',ai:true},{href:'/recipes',icon:Utensils,label:'Recipes'},{href:'/profile',icon:User,label:'Profile'},{href:'/preferences',icon:Heart,label:'Food Prefs'}]
const MOB=[{href:'/dashboard',icon:LayoutDashboard,label:'Home'},{href:'/food-log',icon:BookOpen,label:'Log'},{href:'/scan',icon:ScanLine,label:'Scan',center:true},{href:'/recipes',icon:Utensils,label:'Recipes'},{href:'/profile',icon:User,label:'Profile'}]
export default function Navigation() {
  const pathname=usePathname(), router=useRouter()
  const [dark,setDark]=useState(false), [userName,setUserName]=useState('')
  useEffect(()=>{ setDark(document.documentElement.classList.contains('dark')); const u=getCurrentUser(); if(u) setUserName(u.name.split(' ')[0]) },[])
  function toggleTheme(){ const h=document.documentElement; if(h.classList.contains('dark')){h.classList.remove('dark');localStorage.setItem('napp_theme','light');setDark(false)}else{h.classList.add('dark');localStorage.setItem('napp_theme','dark');setDark(true)} }
  function logout(){ clearSession(); router.push('/') }
  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-4">
        <div className="flex items-center gap-3 px-2 mb-8"><div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center"><Leaf className="w-5 h-5 text-white"/></div><span className="font-bold text-lg text-gradient">NutriAI</span></div>
        <nav className="flex-1 space-y-1">
          {NAV.map(({href,icon:Icon,label,ai})=>(
            <Link key={href} href={href} className={`nav-item ${pathname===href?'nav-item-active':''}`}>
              <Icon className="w-5 h-5 flex-shrink-0"/><span className="flex-1">{label}</span>
              {ai&&<span className="text-[10px] font-bold bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-md">AI</span>}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-2">
          {userName&&<div className="px-4 py-2"><p className="text-xs text-slate-400">Signed in as</p><p className="font-semibold text-sm truncate">{userName}</p></div>}
          <button onClick={toggleTheme} className="nav-item w-full">{dark?<Sun className="w-5 h-5"/>:<Moon className="w-5 h-5"/>}<span>{dark?'Light Mode':'Dark Mode'}</span></button>
          <button onClick={logout} className="nav-item w-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"><LogOut className="w-5 h-5"/><span>Sign Out</span></button>
        </div>
      </aside>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2"><div className="w-7 h-7 gradient-brand rounded-lg flex items-center justify-center"><Leaf className="w-4 h-4 text-white"/></div><span className="font-bold text-gradient">NutriAI</span></div>
        <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">{dark?<Sun className="w-5 h-5"/>:<Moon className="w-5 h-5"/>}</button>
      </header>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex items-end px-2 pb-safe">
        {MOB.map(({href,icon:Icon,label,center})=>{
          const active=pathname===href
          if(center) return <Link key={href} href={href} className="flex-1 flex justify-center -mt-5"><div className={`w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-lg ${active?'scale-95':''} transition-transform`}><Icon className="w-6 h-6 text-white"/></div></Link>
          return <Link key={href} href={href} className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${active?'text-brand-600 dark:text-brand-400':'text-slate-400'}`}><Icon className="w-5 h-5"/>{label}</Link>
        })}
      </nav>
    </>
  )
}
