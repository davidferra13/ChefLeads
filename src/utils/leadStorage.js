// Lead Storage Utility - Handles persistent storage of leads

const STORAGE_KEY = 'chef_leads_archive'
const SYNC_METADATA_KEY = 'chef_leads_sync_metadata'

// Initialize storage if it doesn't exist
const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      leads: [],
      version: '1.0'
    }))
  }
  
  if (!localStorage.getItem(SYNC_METADATA_KEY)) {
    localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify({
      lastSync: null,
      lastMessageId: null,
      hasFullBackfill: false
    }))
  }
}

// Save a new lead or update existing one
export const saveLead = (lead) => {
  initializeStorage()
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
  
  // Check if lead already exists
  const existingIndex = data.leads.findIndex(l => l.id === lead.id)
  
  if (existingIndex >= 0) {
    // Update existing lead
    data.leads[existingIndex] = {
      ...data.leads[existingIndex],
      ...lead,
      updatedAt: new Date().toISOString()
    }
  } else {
    // Add new lead
    data.leads.push({
      ...lead,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false
    })
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return lead
}

// Get all leads with pagination
export const getLeads = ({ page = 1, pageSize = 20, showArchived = false } = {}) => {
  initializeStorage()
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
  
  // Filter archived leads if needed
  let filteredLeads = data.leads.filter(lead => 
    showArchived ? true : !lead.isArchived
  )
  
  // Sort by creation date (newest first)
  filteredLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  
  // Paginate results
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex)
  
  return {
    leads: paginatedLeads,
    totalCount: filteredLeads.length,
    hasNextPage: endIndex < filteredLeads.length,
    hasPreviousPage: page > 1,
    currentPage: page,
    totalPages: Math.ceil(filteredLeads.length / pageSize)
  }
}

// Get a single lead by ID
export const getLead = (id) => {
  initializeStorage()
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
  return data.leads.find(lead => lead.id === id)
}

// Archive/Unarchive a lead
export const toggleArchiveLead = (id, archive = true) => {
  initializeStorage()
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
  
  const leadIndex = data.leads.findIndex(lead => lead.id === id)
  if (leadIndex >= 0) {
    data.leads[leadIndex] = {
      ...data.leads[leadIndex],
      isArchived: archive,
      archivedAt: archive ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return data.leads[leadIndex]
  }
  
  return null
}

// Sync metadata functions
export const getSyncMetadata = () => {
  initializeStorage()
  return JSON.parse(localStorage.getItem(SYNC_METADATA_KEY))
}

export const updateSyncMetadata = (updates) => {
  initializeStorage()
  const currentMetadata = JSON.parse(localStorage.getItem(SYNC_METADATA_KEY))
  const updatedMetadata = { ...currentMetadata, ...updates }
  localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(updatedMetadata))
  return updatedMetadata
}

// Search leads
export const searchLeads = (query) => {
  initializeStorage()
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
  
  if (!query || query.trim() === '') {
    return data.leads.filter(lead => !lead.isArchived)
  }
  
  const searchTerm = query.toLowerCase().trim()
  return data.leads.filter(lead => 
    !lead.isArchived &&
    (lead.host?.toLowerCase().includes(searchTerm) ||
     lead.title?.toLowerCase().includes(searchTerm) ||
     lead.location?.toLowerCase().includes(searchTerm) ||
     lead.status?.toLowerCase().includes(searchTerm))
  )
}

// Export all functions as a default object
const leadStorage = {
  saveLead,
  getLeads,
  getLead,
  toggleArchiveLead,
  getSyncMetadata,
  updateSyncMetadata,
  searchLeads
}

export default leadStorage
