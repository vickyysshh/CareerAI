'use client'

import { useRouter } from 'next/navigation'
import { isAuthenticated } from '../lib/auth'

/**
 * AuthLink intercepts clicks:
 * - If user is authenticated: routes directly to href
 * - If user is not authenticated: routes to /signin?redirect=<href>
 */
export default function AuthLink({ href, children, onClick, ...props }) {
  const router = useRouter()

  function handleClick(e) {
    if (onClick) onClick(e)
    if (e.defaultPrevented) return
    e.preventDefault()

    if (isAuthenticated()) {
      router.push(href)
    } else {
      router.push(`/signin?redirect=${encodeURIComponent(href)}`)
    }
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
