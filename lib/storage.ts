import { UserProfile, FoodPreferences, Session } from './types'
const USERS_KEY='napp_users', SESSION_KEY='napp_session', PREFS_PREFIX='napp_prefs_'

function simpleHash(s: string): string {
  let h=0; for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h=(h<<5)-h+c;h=h&h} return h.toString(36)
}
function lsGet(k: string): string|null { if(typeof window==='undefined')return null; try{return localStorage.getItem(k)}catch{return null} }
function lsSet(k: string, v: string): boolean { if(typeof window==='undefined')return false; try{localStorage.setItem(k,v);return true}catch{return false} }
function lsRemove(k: string): void { if(typeof window==='undefined')return; try{localStorage.removeItem(k)}catch{} }
function getUsers(): UserProfile[] { try{const r=lsGet(USERS_KEY);if(!r)return[];const p=JSON.parse(r);return Array.isArray(p)?p:[]}catch{return[]} }
function saveUsers(u: UserProfile[]): boolean { try{return lsSet(USERS_KEY,JSON.stringify(u))}catch{return false} }

export function registerUser(name: string, email: string, password: string): {success:boolean;error?:string;user?:UserProfile} {
  try {
    if(!email||!password||!name) return {success:false,error:'All fields are required'}
    const users=getUsers(), ne=email.trim().toLowerCase()
    if(users.find(u=>u.email===ne)) return {success:false,error:'Email already registered'}
    const user: UserProfile = {
      id:Date.now().toString(36)+Math.random().toString(36).slice(2), name:name.trim(), email:ne,
      passwordHash:simpleHash(password), age:30, gender:'male', weightKg:75, heightCm:175,
      targetWeightKg:70, activityLevel:'moderate', goal:'maintain',
      createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()
    }
    users.push(user)
    if(!saveUsers(users)) return {success:false,error:'Could not save account — browser storage may be disabled'}
    const verify=getUsers()
    if(!verify.find(u=>u.id===user.id)) return {success:false,error:'Account was not saved correctly — please try again'}
    startSession(user.id); return {success:true,user}
  } catch(err) { console.error(err); return {success:false,error:'Registration failed unexpectedly'} }
}

export function loginUser(email: string, password: string): {success:boolean;error?:string;user?:UserProfile} {
  try {
    if(!email||!password) return {success:false,error:'Email and password are required'}
    const users=getUsers(), ne=email.trim().toLowerCase()
    const user=users.find(u=>u.email===ne)
    if(!user) return {success:false,error:'No account found with that email'}
    if(user.passwordHash!==simpleHash(password)) return {success:false,error:'Incorrect password'}
    startSession(user.id); return {success:true,user}
  } catch(err) { console.error(err); return {success:false,error:'Login failed unexpectedly'} }
}

export function getUser(id: string): UserProfile|null { try{return getUsers().find(u=>u.id===id)??null}catch{return null} }
export function updateUser(id: string, updates: Partial<UserProfile>): UserProfile|null {
  try {
    const users=getUsers(), idx=users.findIndex(u=>u.id===id); if(idx===-1)return null
    users[idx]={...users[idx],...updates,updatedAt:new Date().toISOString()}; saveUsers(users); return users[idx]
  } catch{return null}
}

function startSession(userId: string): void {
  try { lsSet(SESSION_KEY,JSON.stringify({userId,expiresAt:new Date(Date.now()+7*24*60*60*1000).toISOString()})) } catch(e){console.warn(e)}
}
export function getSession(): Session|null {
  try {
    const r=lsGet(SESSION_KEY); if(!r)return null
    const s: Session=JSON.parse(r)
    if(new Date(s.expiresAt)<new Date()){lsRemove(SESSION_KEY);return null}
    return s
  } catch{return null}
}
export function clearSession(): void { lsRemove(SESSION_KEY) }
export function getCurrentUser(): UserProfile|null { try{const s=getSession();if(!s)return null;return getUser(s.userId)}catch{return null} }

export function getFoodPreferences(userId: string): FoodPreferences {
  try{const r=lsGet(PREFS_PREFIX+userId);if(!r)return df();return JSON.parse(r)??df()}catch{return df()}
}
export function saveFoodPreferences(userId: string, prefs: FoodPreferences): void {
  try{lsSet(PREFS_PREFIX+userId,JSON.stringify(prefs))}catch(e){console.warn(e)}
}
function df(): FoodPreferences { return {proteins:[],carbs:[],fruits:[],vegetables:[],dietaryRestrictions:[]} }
