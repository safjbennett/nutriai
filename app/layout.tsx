import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title:'NutriAI – Smart Nutrition Tracker', description:'AI-powered nutrition tracking' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html:`try{var t=localStorage.getItem('napp_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
