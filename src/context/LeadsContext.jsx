import React, { createContext, useState, useContext } from 'react'

// Create context for leads management
const LeadsContext = createContext()

// Custom hook to access leads context
export const useLeads = () => {
  const context = useContext(LeadsContext)
  if (!context) {
    throw new Error('useLeads must be used within a LeadsProvider')
  }
  return context
}

// Provider component for leads state management
export const LeadsProvider = ({ children }) => {
  const [leads, setLeads] = useState([])

  // Add a new lead to the collection
  const addLead = (leadData) => {
    const newLead = {
      id: Date.now(),
      status: 'New',
      createdAt: new Date().toISOString(),
      ...leadData,
    }
    setLeads(previousLeads => [...previousLeads, newLead])
    return newLead
  }

  // Update an existing lead by ID
  const updateLead = (leadId, updates) => {
    setLeads(previousLeads => 
      previousLeads.map(lead => 
        lead.id === leadId 
          ? { ...lead, ...updates } 
          : lead
      )
    )
  }

  // Get leads with optional filtering
  const getLeads = (filters = {}) => {
    return leads.filter(lead => {
      return Object.entries(filters).every(([filterKey, filterValue]) => {
        if (filterKey === 'date') {
          return lead.date === filterValue
        }
        if (filterKey === 'status') {
          return lead.status === filterValue
        }
        return true
      })
    })
  }

  // Get a specific lead by ID
  const getLeadById = (leadId) => {
    return leads.find(lead => lead.id === leadId)
  }

  const contextValue = {
    leads,
    addLead,
    updateLead,
    getLeads,
    getLeadById
  }

  return (
    <LeadsContext.Provider value={contextValue}>
      {children}
    </LeadsContext.Provider>
  )
}
