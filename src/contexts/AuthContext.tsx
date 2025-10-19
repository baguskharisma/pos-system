"use client"

import { createContext, useContext, ReactNode } from "react"
import { SessionProvider } from "next-auth/react"
import { Session } from "next-auth"

interface AuthContextType {
  // Add any additional auth-related state or methods here
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  session?: Session | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session} refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <AuthContext.Provider value={{}}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
