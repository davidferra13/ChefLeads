import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Button, 
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Chip,
  IconButton,
  TablePagination,
  Tooltip
} from '@mui/material'
import { 
  Search, 
  FiberNew,
  Update,
  PhoneCallback,
  CheckCircle,
  AccessTime,
  Add,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  Email as EmailIcon
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useLeads } from '../context/LeadsContext'
import Navigation from '../components/Navigation'

// Status configuration with icons and colors
const statusConfig = [
  { 
    name: 'New', 
    value: 'New',
    icon: <FiberNew fontSize="large" />, 
    color: 'primary.light',
    textColor: 'primary.main'
  },
  { 
    name: 'Follow Up', 
    value: 'Follow Up',
    icon: <AccessTime fontSize="large" />, 
    color: 'warning.light',
    textColor: 'warning.main'
  },
  { 
    name: 'Contacted', 
    value: 'Contacted',
    icon: <PhoneCallback fontSize="large" />, 
    color: 'info.light',
    textColor: 'info.main'
  },
  { 
    name: 'Completed', 
    value: 'Completed',
    icon: <CheckCircle fontSize="large" />, 
    color: 'success.light',
    textColor: 'success.main'
  },
  { 
    name: 'Stale', 
    value: 'Stale',
    icon: <Update fontSize="large" />, 
    color: 'error.light',
    textColor: 'error.main'
  }
]

// Create status mapping for quick lookup
const statusLookup = statusConfig.reduce((lookup, status) => {
  lookup[status.value] = status
  return lookup
}, {})

const LeadsPage = () => {
  const navigate = useNavigate()
  const { leads, updateLead } = useLeads()
  
  // State management
  const [selectedTab, setSelectedTab] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [statusFilter, setStatusFilter] = useState('all')

  // Event handlers
  const handleTabChange = (event, newTabValue) => {
    setSelectedTab(newTabValue)
    setCurrentPage(0)
  }

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage)
  }

  const handleRowsPerPageChange = (event) => {
    setItemsPerPage(parseInt(event.target.value, 10))
    setCurrentPage(0)
  }

  const handleStatusUpdate = (leadId, newStatus) => {
    updateLead(leadId, { status: newStatus })
  }

  // Filter leads based on search and status
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.host?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.location?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Paginate filtered leads
  const paginatedLeads = filteredLeads.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  )

  // Calculate status counts
  const statusCounts = leads.reduce((counts, lead) => {
    counts[lead.status] = (counts[lead.status] || 0) + 1
    return counts
  }, {})

  return (
    <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
      <Navigation />
      
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Typography variant="h4" component="h1">
          Leads
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={() => navigate('/add-lead')}
        >
          Add Lead
        </Button>
      </Box>

      {/* Status Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statusConfig.map((status, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={status.name}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                border: selectedTab === index ? `2px solid ${status.color}` : 'none',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.2s',
                },
              }}
              onClick={() => {
                setSelectedTab(index)
                setStatusFilter(status.value)
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: status.color, mb: 1 }}>
                  {status.icon}
                </Box>
                <Typography variant="h6" component="div" sx={{ color: status.textColor }}>
                  {statusCounts[status.value] || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {status.name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Card */}
      <Card sx={{ mb: 4 }}>
        {/* Filters and Search */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between', 
          p: 2, 
          gap: 2 
        }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: { xs: 2, md: 0 } }}
          >
            <Tab label="All Leads" onClick={() => setStatusFilter('all')} />
            {statusConfig.map(status => (
              <Tab 
                key={status.value} 
                label={status.name} 
                onClick={() => setStatusFilter(status.value)}
              />
            ))}
          </Tabs>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: 2, 
            width: { xs: '100%', md: 'auto' } 
          }}>
            <TextField
              size="small"
              placeholder="Search leads..."
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { xs: '100%', sm: 250 } }}
            />
            <Select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Filter by status' }}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {statusConfig.map(status => (
                <MenuItem key={status.value} value={status.value}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
        
        <Divider />
        
        {/* Data Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Host</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLeads.length > 0 ? (
                paginatedLeads.map((lead) => {
                  const statusInfo = statusLookup[lead.status] || statusConfig[0]
                  const leadDate = lead.date ? new Date(lead.date) : null
                  
                  return (
                    <TableRow key={lead.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {lead.host || 'No host'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lead.guestCount ? `${lead.guestCount} guests` : 'No guest count'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {lead.title || 'No title'}
                        </Typography>
                        {lead.eventTheme && (
                          <Chip 
                            label={lead.eventTheme} 
                            size="small" 
                            sx={{ mt: 0.5, fontSize: '0.7rem' }} 
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {leadDate ? (
                          <>
                            <Typography variant="body2">
                              {format(leadDate, 'MMM d, yyyy')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(leadDate, 'h:mm a')}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No date set
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {lead.location || 'No location'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                          size="small"
                          sx={{
                            minWidth: 120,
                            '& .MuiSelect-select': {
                              color: statusInfo.textColor,
                              backgroundColor: statusInfo.color + '22',
                              borderRadius: 1,
                              py: 0.5,
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: 'none',
                            },
                          }}
                        >
                          {statusConfig.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="View in Calendar">
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                if (leadDate) {
                                  navigate(`/calendar?date=${format(leadDate, 'yyyy-MM-dd')}`)
                                } else {
                                  navigate('/calendar')
                                }
                              }}
                            >
                              <CalendarIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => navigate(`/edit-lead/${lead.id}`)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <EmailIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'No matching leads found. Try adjusting your search or filters.'
                        : 'No leads found. Add your first lead to get started.'}
                    </Typography>
                    {(!searchQuery && statusFilter === 'all') && (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<Add />}
                        onClick={() => navigate('/add-lead')}
                        sx={{ mt: 2 }}
                      >
                        Add Your First Lead
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredLeads.length}
          rowsPerPage={itemsPerPage}
          page={currentPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Card>
    </Container>
  )
}

export default LeadsPage
