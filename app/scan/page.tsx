'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { getCurrentUser } from '@/lib/storage'
import { UserProfile } from '@/lib/types'
import { addEntry } from '@/lib/food-log'

interface FoodAnalysis {
  name: string
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
  confidence: 'high' | 'medium' | 'low'
  notes: string
  alternatives: Array<{ name: string; calories: number; protein: number; carbs: number; fat: number }>
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export default function ScanPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview' | 'analyzing' | 'result'>('idle')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null)
  const [error, setError] = useState('')
  const [addedToLog, setAddedToLog] = useState(false)
  const [ios, setIos] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.push('/'); return }
    setUser(u)
    setIos(isIOS())
  }, [router])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError('')
    setError('')
    setMode('camera')

    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: 'environment' } },
      { video: true }
    ]

    for (const constraint of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint)
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('webkit-playsinline', '')
          videoRef.current.setAttribute('playsinline', '')
          await new Promise<void>((resolve, reject) => {
            if (!videoRef.current) return reject()
            videoRef.current.onloadedmetadata = () => resolve()
            videoRef.current.onerror = reject
            setTimeout(resolve, 3000)
          })
          try { await videoRef.current.play() } catch { /* ignore play() rejection on some browsers */ }
        }
        return
      } catch {
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
      }
    }

    setCameraError('Could not access camera. Please use the "Upload Photo" option.')
    setMode('idle')
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(dataUrl)
    stopCamera()
    setMode('preview')
  }, [stopCamera])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const src = ev.target?.result as string
      // Compress large images via canvas
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas')
        const MAX = 800
        let { width, height } = img
        if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          setCapturedImage(canvas.toDataURL('image/jpeg', 0.85))
        } else {
          setCapturedImage(src)
        }
        setMode('preview')
      }
      img.src = src
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }, [])

  const analyzeFood = useCallback(async () => {
    if (!capturedImage) return
    setMode('analyzing')
    setError('')
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage, mimeType: 'image/jpeg' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data.analysis)
      setMode('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Please try again.')
      setMode('preview')
    }
  }, [capturedImage])

  function addToLog() {
    if (!user || !analysis) return
    const today = new Date().toISOString().split('T')[0]
    addEntry(user.id, today, {
      name: analysis.name,
      calories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fat: analysis.fat,
      portion: analysis.portion,
      mealType: 'snack'
    })
    setAddedToLog(true)
    setTimeout(() => router.push('/food-log'), 1500)
  }

  function reset() {
    stopCamera()
    setCapturedImage(null)
    setAnalysis(null)
    setError('')
    setAddedToLog(false)
    setCameraError('')
    setMode('idle')
  }

  const confidenceColors = { high: 'text-green-600', medium: 'text-yellow-600', low: 'text-red-600' }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      {/* Hidden canvas for capture/compression */}
      <canvas ref={canvasRef} className="hidden" />
      {/* Hidden file input — primary iOS method */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      <main className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Food Scanner</h1>
              <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 text-xs rounded-full font-semibold">AI</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Take or upload a photo of your food to instantly estimate nutrition</p>
          </div>

          {/* IDLE STATE */}
          {mode === 'idle' && (
            <div className="space-y-4">
              {cameraError && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-700 dark:text-yellow-400 text-sm">
                  ⚠️ {cameraError}
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="text-7xl mb-4">📷</div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Point your camera at any food or meal to get instant macro estimates powered by Claude AI</p>
                <div className="flex flex-col gap-3">
                  {/* On iOS, primary button triggers the native camera/photo picker */}
                  {ios ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors shadow"
                    >
                      📸 Take Photo
                    </button>
                  ) : (
                    <button
                      onClick={startCamera}
                      className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors shadow"
                    >
                      📸 Open Camera
                    </button>
                  )}
                  {/* Upload option always available */}
                  <button
                    onClick={() => {
                      // Without capture attribute for non-iOS so they can pick from gallery
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (ev) => {
                        const file = (ev.target as HTMLInputElement).files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = e2 => {
                          const src = e2.target?.result as string
                          const img = new Image()
                          img.onload = () => {
                            const canvas = canvasRef.current || document.createElement('canvas')
                            const MAX = 800
                            let { width, height } = img
                            if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX }
                            canvas.width = width; canvas.height = height
                            const ctx = canvas.getContext('2d')
                            if (ctx) { ctx.drawImage(img, 0, 0, width, height); setCapturedImage(canvas.toDataURL('image/jpeg', 0.85)) }
                            else setCapturedImage(src)
                            setMode('preview')
                          }
                          img.src = src
                        }
                        reader.readAsDataURL(file)
                      }
                      input.click()
                    }}
                    className="w-full py-3.5 border-2 border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-400 rounded-xl font-semibold hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  >
                    🖼️ Upload from Gallery
                  </button>
                </div>
              </div>

              <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 text-sm text-brand-700 dark:text-brand-300">
                <strong>Tips for best results:</strong> Good lighting, full plate visible, close-up shots work best. AI estimates are approximate — adjust for exact portion sizes.
              </div>
            </div>
          )}

          {/* LIVE CAMERA */}
          {mode === 'camera' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-6 border-2 border-white/50 rounded-2xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/30 text-sm">Center your food here</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium">Cancel</button>
                <button onClick={capturePhoto} className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors">📸 Capture</button>
              </div>
            </div>
          )}

          {/* PREVIEW */}
          {mode === 'preview' && capturedImage && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden shadow-md">
                <img src={capturedImage} alt="Food to analyze" className="w-full max-h-80 object-cover" />
              </div>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium">Retake</button>
                <button onClick={analyzeFood} className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                  🤖 Analyze Food
                </button>
              </div>
            </div>
          )}

          {/* ANALYZING */}
          {mode === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Analyzing your food...</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">Claude AI is identifying ingredients and estimating nutritional content</p>
            </div>
          )}

          {/* RESULT */}
          {mode === 'result' && analysis && (
            <div className="space-y-4">
              {capturedImage && (
                <div className="rounded-2xl overflow-hidden shadow-md relative">
                  <img src={capturedImage} alt="Analyzed food" className="w-full max-h-52 object-cover" />
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    Confidence: <span className={confidenceColors[analysis.confidence]}>{analysis.confidence}</span>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{analysis.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">{analysis.portion} · {analysis.notes}</p>

                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Calories', value: analysis.calories, unit: 'kcal', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
                    { label: 'Protein', value: analysis.protein, unit: 'g', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
                    { label: 'Carbs', value: analysis.carbs, unit: 'g', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' },
                    { label: 'Fat', value: analysis.fat, unit: 'g', color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
                  ].map(m => (
                    <div key={m.label} className={`rounded-xl p-3 text-center ${m.color}`}>
                      <div className="text-xl font-bold">{m.value}</div>
                      <div className="text-xs opacity-80">{m.label}</div>
                      <div className="text-xs opacity-60">{m.unit}</div>
                    </div>
                  ))}
                </div>

                {analysis.alternatives?.length > 0 && (
                  <div className="mb-5 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Alternative portion estimates:</p>
                    {analysis.alternatives.map((alt, i) => (
                      <div key={i} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                        <span>{alt.name}</span>
                        <span className="text-gray-500">{alt.calories} kcal · P{alt.protein}g · C{alt.carbs}g · F{alt.fat}g</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={reset} className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium">Scan Again</button>
                  <button
                    onClick={addToLog}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${addedToLog ? 'bg-green-500 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'}`}
                  >
                    {addedToLog ? '✓ Added to Log!' : '+ Add to Log'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
