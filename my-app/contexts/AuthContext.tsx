"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    console.log('AuthContext initializing...')
    const storedToken = localStorage.getItem('auth_token')
    console.log('Stored token:', storedToken ? 'exists' : 'none')
    if (storedToken) {
      verifyToken(storedToken)
    } else {
      console.log('No token found, setting loading to false')
      setIsLoading(false)
    }
  }, [])

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch('http://localhost:3001/verify-token', {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setToken(tokenToVerify)
        localStorage.setItem('auth_token', tokenToVerify)
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('auth_token', data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const signup = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('http://localhost:3001/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('auth_token', data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Signup failed' }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    
    // Call logout endpoint to clean up server-side (optional)
    fetch('http://localhost:3001/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).catch(error => console.error('Logout request failed:', error))
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
