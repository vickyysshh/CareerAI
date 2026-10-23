'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Routes where the animated grid background must NOT appear
const EXCLUDED_ROUTES = ['/', '/signin', '/register', '/forgot-password']

export default function AuthenticatedBackground() {
  const pathname = usePathname()

  // Match root or any public auth route
  const isExcluded =
    !pathname ||
    EXCLUDED_ROUTES.includes(pathname) ||
    EXCLUDED_ROUTES.some((route) => route !== '/' && pathname.startsWith(route))

  useEffect(() => {
    if (!isExcluded) {
      document.body.classList.add('ciq-auth-page')
    } else {
      document.body.classList.remove('ciq-auth-page')
    }

    return () => {
      document.body.classList.remove('ciq-auth-page')
    }
  }, [isExcluded])

  if (isExcluded) {
    return null
  }

  return <div className="ciq-authenticated-grid-bg" aria-hidden="true" />
}
