import React from 'react';
import { Alert, Box, Typography, Link } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

/**
 * Banner to display when the application is running in demo mode
 * Shows information about missing OAuth credentials and how to set them up
 */
const DemoModeBanner = ({ serviceName = null }) => {
  const message = serviceName
    ? `${serviceName} OAuth credentials not found`
    : 'OAuth credentials not found';

  return (
    <Alert 
      severity="info" 
      icon={<InfoIcon />}
      sx={{ 
        mb: 3, 
        border: '1px dashed',
        '& .MuiAlert-message': { width: '100%' }
      }}
    >
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {message} - Running in Demo Mode
        </Typography>
        <Typography variant="body2">
          The application is currently running in demo mode because OAuth credentials are not configured. 
          Authentication flows will be simulated.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          To enable real OAuth authentication:
        </Typography>
        <ul style={{ marginTop: 4, marginBottom: 8 }}>
          <li>
            <Typography variant="body2">
              Create a <code>.env</code> file in the project root
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Add OAuth credentials for the services you want to enable
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Restart the application
            </Typography>
          </li>
        </ul>
        <Typography variant="body2">
          See <Link href="https://github.com/example/docs" target="_blank">.env.example</Link> for required variables.
        </Typography>
      </Box>
    </Alert>
  );
};

export default DemoModeBanner;
