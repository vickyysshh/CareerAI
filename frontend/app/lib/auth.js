// Authentication utility for CareerIQ client-side state
export function isAuthenticated() {
  if (typeof window === 'undefined') return false
  const loggedIn = localStorage.getItem('ciq_logged_in')
  const token = localStorage.getItem('ciq_token') || sessionStorage.getItem('ciq_token')
  return loggedIn === 'true' || Boolean(token)
}

export function loginUser(userData = {}) {
  if (typeof window === 'undefined') return
  localStorage.setItem('ciq_logged_in', 'true')
  localStorage.setItem(
    'ciq_user',
    JSON.stringify({
      email: userData.email || 'user@careeriq.ai',
      name: userData.name || (userData.email ? userData.email.split('@')[0] : 'Engineer'),
      loginAt: new Date().toISOString(),
    })
  )
}

export function logoutUser() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('ciq_logged_in')
  localStorage.removeItem('ciq_user')
  localStorage.removeItem('ciq_token')
  sessionStorage.removeItem('ciq_token')
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('ciq_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
