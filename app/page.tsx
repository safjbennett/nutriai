'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, Eye, EyeOff } from 'lucide-react'
import { loginUser, registerUser, getSession } from '@/lib/storage'

function StorageWarning() {
  const [blocked, setBlocked] = useState(false)
  useEffect(() => { try { localStorage.setItem('__t','1'); localStorage.removeItem('__t') } catch { setBlocked(true) } }, [])
  if (!blocked) return null
  return <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs px-4 py-3 rounded-xl">⚠️ Browser storage appears disabled (e.g. private mode). Accounts cannot be saved in this mode.</div>
}

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login'|'signup'>('login')
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false), [error, setError] = useState(''), [loading, setLoading] = useState(false)
  useEffect(() => { if (getSession()) router.replace('/dashboard') }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (tab === 'login') {
        const res = loginUser(email, password)
        if (!res.success) { setError(res.error ?? 'Login failed'); setLoading(false); return }
      } else {
        if (!name.trim()) { setError('Please enter your name'); setLoading(false); return }
        const res = registerUser(name.trim(), email, password)
        if (!res.success) { setError(res.error ?? 'Registration failed'); setLoading(false); return }
      }
      router.push('/dashboard')
    } catch (err: unknown) {
      console.error(err); setError('Something went wrong. Please try again.'); setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-8 mx-auto"><Leaf className="w-10 h-10 text-white" /></div>
          <h1 className="text-4xl font-bold mb-4">NutriAI</h1>
          <p className="text-xl text-white/80 mb-8">Your AI-powered nutrition companion. Personalised macros, viral recipes, and smart food scanning.</p>
          <div className="grid grid-cols-3 gap-4">
            {[{emoji:'🎯',label:'Personalised\nMacros'},{emoji:'📸',label:'AI Food\nScanner'},{emoji:'🔥',label:'Viral\nRecipes'}].map(f=>(
              <div key={f.label} className="bg-white/10 rounded-2xl p-4"><div className="text-3xl mb-2">{f.emoji}</div><div className="text-xs text-white/80 whitespace-pre-line font-medium">{f.label}</div></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-3"><Leaf className="w-7 h-7 text-white" /></div>
            <h1 className="text-2xl font-bold text-gradient">NutriAI</h1>
          </div>
          <div className="card">
            <h2 className="text-2xl font-bold mb-1">{tab==='login'?'Welcome back':'Get started'}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{tab==='login'?'Sign in to your account':'Create your free account'}</p>
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-6">
              {(['login','signup'] as const).map(t=>(
                <button key={t} onClick={()=>{setTab(t);setError('')}} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab===t?'bg-white dark:bg-slate-600 text-brand-600 dark:text-brand-400 shadow-sm':'text-slate-500 dark:text-slate-400'}`}>{t==='login'?'Sign In':'Sign Up'}</button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab==='signup'&&<div><label className="label">Full Name</label><input className="input" placeholder="Jane Smith" value={name} onChange={e=>setName(e.target.value)} required autoComplete="name" /></div>}
              <div><label className="label">Email</label><input type="email" className="input" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input type={showPw?'text':'password'} className="input pr-12" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required autoComplete={tab==='login'?'current-password':'new-password'} />
                  <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPw?<EyeOff className="w-5 h-5"/>:<Eye className="w-5 h-5"/>}</button>
                </div>
              </div>
              {error&&<div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-2.5 rounded-xl">{error}</div>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>{loading?'Please wait…':tab==='login'?'Sign In':'Create Account'}</button>
            </form>
            <StorageWarning />
          </div>
        </div>
      </div>
    </div>
  )
}
