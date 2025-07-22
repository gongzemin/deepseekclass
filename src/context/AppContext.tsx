'use client'
import React, { createContext, useContext, ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'

type UserType = ReturnType<typeof useUser>['user']

interface AppContextType {
  user: UserType
}

interface AppContextType {
  user: UserType
}
export const AppContext = createContext<AppContextType>({
  user: null,
})
export const useAppContext = () => useContext(AppContext)

interface AppContextProviderProps {
  children: ReactNode
}

export const AppContextProvider = ({ children }: AppContextProviderProps) => {
  const { user } = useUser()
  const value: AppContextType = {
    user,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
