import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline } from '@mui/material'
import { LeadsProvider } from './context/LeadsContext'
import LeadsPage from './pages/LeadsPage'
import CalendarPage from './pages/CalendarPage'
import SignInHubPage from './pages/SignInHubPage'
import AddLeadPage from './pages/AddLeadPage'
import SmsLeadsPage from './pages/SmsLeadsPage'
import AccountConnectionsPage from './pages/AccountConnectionsPage'
import AuthCallbackHandler from './components/auth/AuthCallbackHandler'
import OAuthCallbackHandler from './components/auth/OAuthCallbackHandler'

function App() {
  return (
    <LeadsProvider>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5' 
      }}>
        <CssBaseline />
        <Routes>
          <Route 
            path="/" 
            element={<Navigate to="/leads" replace />} 
          />
          <Route 
            path="/leads" 
            element={<LeadsPage />} 
          />
          <Route 
            path="/calendar" 
            element={<CalendarPage />} 
          />
          <Route 
            path="/add-lead" 
            element={<AddLeadPage />} 
          />
          <Route 
            path="/edit-lead/:id" 
            element={<AddLeadPage editMode />} 
          />
          <Route 
            path="/account-connections" 
            element={<AccountConnectionsPage />} 
          />
          <Route 
            path="/sms-leads" 
            element={<SmsLeadsPage />} 
          />
          <Route 
            path="/auth-callback" 
            element={<AuthCallbackHandler />} 
          />
          <Route 
            path="/auth/:service/callback" 
            element={<OAuthCallbackHandler />} 
          />
          <Route 
            path="/signin-hub" 
            element={<SignInHubPage />} 
          />
          <Route 
            path="*" 
            element={<Navigate to="/leads" replace />} 
          />
        </Routes>
      </div>
    </LeadsProvider>
  )
}

export default App
