import { createContext, useContext, type PropsWithChildren } from 'react'
import { useTheme as useThemeState } from '../hooks/useTheme'

type ThemeContextValue = ReturnType<typeof useThemeState>

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const value = useThemeState()

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
