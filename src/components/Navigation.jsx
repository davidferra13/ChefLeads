import React from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Box, 
  Typography, 
  useMediaQuery, 
  useTheme 
} from '@mui/material'
import { 
  Add as AddIcon, 
  List as ListIcon, 
  CalendarToday as CalendarIcon, 
  Link as LinkIcon,
  Sms as SmsIcon
} from '@mui/icons-material'

const Navigation = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const location = useLocation()

  const navigationItems = [
    { 
      label: 'Leads', 
      path: '/leads', 
      icon: <ListIcon sx={{ mr: isMobile ? 0 : 1 }} /> 
    },
    { 
      label: 'Calendar', 
      path: '/calendar', 
      icon: <CalendarIcon sx={{ mr: isMobile ? 0 : 1 }} /> 
    },
    { 
      label: 'Account Connections', 
      path: '/account-connections', 
      icon: <LinkIcon sx={{ mr: isMobile ? 0 : 1 }} /> 
    },
    { 
      label: 'SMS Leads', 
      path: '/sms-leads', 
      icon: <SmsIcon sx={{ mr: isMobile ? 0 : 1 }} /> 
    },
    { 
      label: 'Add Lead', 
      path: '/add-lead', 
      icon: <AddIcon sx={{ mr: isMobile ? 0 : 1 }} /> 
    }
  ]

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        px: { xs: 1, sm: 2 } 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            component="img" 
            src="/logo.png" 
            alt="Logo" 
            sx={{ 
              height: 40, 
              width: 'auto',
              mr: 2,
              display: { xs: 'none', sm: 'block' }
            }} 
          />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Chef Booking
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              component={RouterLink}
              to={item.path}
              startIcon={isMobile ? item.icon : null}
              sx={{
                color: location.pathname === item.path 
                  ? 'primary.main' 
                  : 'text.primary',
                fontWeight: location.pathname === item.path 
                  ? 'bold' 
                  : 'normal',
                minWidth: 'auto',
                px: { xs: 1, sm: 2 },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '&.MuiButton-root': {
                  borderRadius: 2,
                },
              }}
            >
              {isMobile ? null : item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navigation
