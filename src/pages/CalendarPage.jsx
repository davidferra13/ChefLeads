import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  format, 
  parseISO, 
  isSameDay, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  startOfWeek,
  endOfWeek
} from 'date-fns'
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { 
  Add as AddIcon, 
  ChevronLeft, 
  ChevronRight, 
  Today as TodayIcon,
  Event as EventIcon
} from '@mui/icons-material'
import { useLeads } from '../context/LeadsContext'
import Navigation from '../components/Navigation'

// Status color mapping for event chips
const statusColorMap = {
  'New': 'primary',
  'Follow Up': 'warning',
  'Contacted': 'secondary',
  'Completed': 'success',
  'Stale': 'error'
}

// Event component for calendar display
const EventItem = ({ event, onClick }) => {
  const statusColor = statusColorMap[event.status] || 'default'
  
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 0.5,
        mb: 0.5,
        bgcolor: `${statusColor}.light`,
        border: `1px solid`,
        borderColor: `${statusColor}.main`,
        borderRadius: 1,
        cursor: 'pointer',
        fontSize: '0.75rem',
        lineHeight: 1.2,
        '&:hover': {
          bgcolor: `${statusColor}.main`,
          color: 'white',
        },
        transition: 'all 0.2s',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
        {event.time && format(parseISO(`2000-01-01T${event.time}`), 'h:mm a')}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block' }}>
        {event.title}
      </Typography>
      {event.host && (
        <Typography variant="caption" sx={{ 
          display: 'block', 
          opacity: 0.8,
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {event.host}
        </Typography>
      )}
    </Box>
  )
}

// Main Calendar component
const CalendarPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { leads } = useLeads()
  
  // Initialize current date from URL parameters or use today's date
  const initialDate = searchParams.get('date') 
    ? parseISO(searchParams.get('date')) 
    : new Date()
    
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  
  // Calendar navigation functions
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const goToPreviousMonth = () => {
    setCurrentDate(current => subMonths(current, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(current => addMonths(current, 1))
  }
  
  // Calculate calendar grid dates
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  })
  
  // Transform leads into calendar events
  const calendarEvents = leads
    .filter(lead => lead.date) // Only include leads with dates
    .map(lead => ({
      ...lead,
      date: parseISO(lead.date), // Convert string to Date object
      time: lead.time || '00:00',
      title: lead.title || 'Untitled Event',
      status: lead.status || 'New',
    }))
  
  // Get events for a specific date
  const getEventsForDate = (date) => {
    if (!date) return []
    return calendarEvents
      .filter(event => isSameDay(event.date, date))
      .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))
  }
  
  // Event handlers
  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setShowEventDialog(true)
  }
  
  const handleEditEvent = (eventId) => {
    navigate(`/edit-lead/${eventId}`)
  }
  
  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Navigation />
      
      {/* Calendar Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          flexWrap: 'wrap' 
        }}>
          <IconButton onClick={goToPreviousMonth} size="small">
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" component="h1">
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={goToNextMonth} size="small">
            <ChevronRight />
          </IconButton>
          <Button 
            variant="outlined" 
            onClick={goToToday}
            startIcon={<TodayIcon />}
            size="small"
          >
            Today
          </Button>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/add-lead')}
          size="small"
        >
          Add Event
        </Button>
      </Box>
      
      {/* Calendar Grid */}
      <Paper elevation={0} sx={{ 
        mb: 3, 
        bgcolor: 'background.paper', 
        borderRadius: 1, 
        boxShadow: 1,
        overflow: 'hidden'
      }}>
        {/* Day of Week Headers */}
        <Grid container spacing={0}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
            <Grid item xs={12/7} key={dayName}>
              <Box sx={{ 
                p: 1, 
                textAlign: 'center',
                fontWeight: 'bold',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'grey.100'
              }}>
                {dayName}
              </Box>
            </Grid>
          ))}
        </Grid>
        
        {/* Calendar Day Cells */}
        <Grid container spacing={0}>
          {calendarDays.map((date, index) => {
            const dayEvents = getEventsForDate(date)
            const isCurrentMonth = date ? isSameMonth(date, currentDate) : false
            const isCurrentDay = date ? isToday(date) : false
            
            return (
              <Grid 
                item 
                xs={12/7} 
                key={date ? date.toString() : `empty-${index}`}
                sx={{
                  minHeight: { xs: 80, sm: 100, md: 120 },
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: isCurrentDay ? 'primary.lighter' : 'background.paper',
                  opacity: isCurrentMonth ? 1 : 0.5,
                  p: 0.5,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                {date && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 0.5,
                    p: 0.5
                  }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={isCurrentDay ? 'bold' : 'normal'}
                      color={isCurrentDay ? 'primary.main' : 'text.primary'}
                      sx={{
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: isCurrentDay ? 'primary.main' : 'transparent',
                        color: isCurrentDay ? 'primary.contrastText' : 'inherit'
                      }}
                    >
                      {format(date, 'd')}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ 
                  maxHeight: { xs: 60, sm: 80, md: 100 }, 
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '0.2em'
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.1)'
                  }
                }}>
                  {date && dayEvents.map((event, eventIndex) => (
                    <EventItem 
                      key={eventIndex} 
                      event={event} 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEventClick(event)
                      }} 
                    />
                  ))}
                </Box>
              </Grid>
            )
          })}
        </Grid>
      </Paper>
      
      {/* Event Details Dialog */}
      <Dialog 
        open={showEventDialog} 
        onClose={() => setShowEventDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Event Details</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box>
              <Typography variant="h6">{selectedEvent.title}</Typography>
              <Typography color="textSecondary">
                {format(selectedEvent.date, 'EEEE, MMMM d, yyyy')} at {selectedEvent.time}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                {selectedEvent.description || 'No description'}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Status: <Chip 
                  label={selectedEvent.status} 
                  size="small" 
                  color={statusColorMap[selectedEvent.status] || 'default'}
                />
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventDialog(false)}>Close</Button>
          <Button 
            onClick={() => selectedEvent && handleEditEvent(selectedEvent.id)} 
            variant="contained"
            color="primary"
          >
            Edit Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CalendarPage
