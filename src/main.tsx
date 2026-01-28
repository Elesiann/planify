import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'react-hot-toast'
import { router } from './app/router'
import { AuthProvider } from './lib/auth'
import { HouseholdProvider } from './lib/HouseholdProvider'
import { queryClient } from './lib/queryClient'
import { ThemeProvider } from './lib/ThemeProvider'
import './globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <HouseholdProvider>
            <RouterProvider router={router} />
            <Toaster position="bottom-right" />
          </HouseholdProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)

