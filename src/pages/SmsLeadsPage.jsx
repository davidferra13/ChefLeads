import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Button,
  Stack,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LinkIcon from '@mui/icons-material/Link';
import SyncIcon from '@mui/icons-material/Sync';
import CheckIcon from '@mui/icons-material/Check';
import DiscordIcon from '@mui/icons-material/Tag';
import { format } from 'date-fns';

// Import the lead storage utility
import * as leadStorage from '../utils/leadStorage';

const SmsLeadsPage = () => {
  // State for leads and pagination
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  
  // Account connection states
  const [connectedAccounts, setConnectedAccounts] = useState([
    {
      id: 'discord-webhook-1',
      type: 'Discord',
      name: 'Chef Leads Discord',
      status: 'active',
      webhookUrl: process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/...',
      lastSync: new Date().toISOString()
    }
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load leads on component mount
  useEffect(() => {
    loadLeads();
  }, [page, rowsPerPage]);

  // Function to load SMS leads from storage
  const loadLeads = () => {
    const { leads: allLeads, totalCount } = leadStorage.getLeads({
      page: page + 1,
      pageSize: rowsPerPage
    });
    
    // Filter only SMS leads from Discord
    const smsLeads = allLeads.filter(lead => 
      lead.source === "SMS via Discord"
    );
    
    setLeads(smsLeads);
    setTotalCount(totalCount);
    applyFilter(smsLeads);
  };

  // Apply search filter to leads
  const applyFilter = (leadsToFilter = leads) => {
    if (!searchTerm) {
      setFilteredLeads(leadsToFilter);
      return;
    }
    
    const filtered = leadsToFilter.filter(lead => 
      (lead.rawMessage && lead.rawMessage.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.sender && lead.sender.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredLeads(filtered);
  };

  // Handle search input changes
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    applyFilter();
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Mark lead as handled
  const handleMarkAsHandled = (leadId) => {
    leadStorage.updateLead(leadId, { status: 'Handled' });
    loadLeads();
  };

  // Format confidence score as percentage and color code
  const renderConfidence = (score) => {
    let color = 'error';
    if (score >= 0.7) color = 'success';
    else if (score >= 0.4) color = 'warning';
    
    return (
      <Chip 
        label={`${Math.round(score * 100)}%`}
        color={color}
        size="small"
        variant="outlined"
      />
    );
  };

  // Handle refresh connection
  const refreshConnection = (id) => {
    setIsRefreshing(true);
    
    // Simulate a connection refresh
    setTimeout(() => {
      setConnectedAccounts(current => 
        current.map(account => 
          account.id === id 
            ? { ...account, lastSync: new Date().toISOString() } 
            : account
        )
      );
      setIsRefreshing(false);
    }, 1500);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        SMS Leads via Discord
      </Typography>

      {/* Account Connections Section */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <LinkIcon sx={{ mr: 1 }} /> Account Connections
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Connected accounts that are tethered with the SMS lead detection bot.
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {connectedAccounts.length > 0 ? (
            <Grid container spacing={2}>
              {connectedAccounts.map((account) => (
                <Grid item xs={12} sm={6} md={4} key={account.id}>
                  <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <DiscordIcon color="primary" />
                        <Typography variant="subtitle1">{account.name}</Typography>
                        <Chip 
                          size="small" 
                          color={account.status === 'active' ? 'success' : 'error'}
                          icon={account.status === 'active' ? <CheckIcon /> : null}
                          label={account.status === 'active' ? 'Connected' : 'Disconnected'}
                        />
                      </Stack>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, wordBreak: 'break-all' }}>
                        Webhook URL: {account.webhookUrl.substring(0, 20)}...
                      </Typography>
                      
                      <Typography variant="caption" display="block" color="text.secondary">
                        Last sync: {format(new Date(account.lastSync), 'MMM d, yyyy h:mm a')}
                      </Typography>
                      
                      <Button 
                        startIcon={<SyncIcon />} 
                        size="small" 
                        variant="outlined" 
                        onClick={() => refreshConnection(account.id)}
                        disabled={isRefreshing}
                        sx={{ mt: 1 }}
                      >
                        {isRefreshing ? 'Refreshing...' : 'Refresh Connection'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
              No connected accounts found. Set up a Discord webhook to receive SMS leads.
            </Typography>
          )}
        </CardContent>
      </Card>
      
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <TextField
          label="Search Messages"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date/Time</TableCell>
              <TableCell>From</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell>Keywords</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    {lead.timestamp ? format(new Date(lead.timestamp), 'MMM d, yyyy h:mm a') : 'Unknown'}
                  </TableCell>
                  <TableCell>{lead.sender || 'Unknown'}</TableCell>
                  <TableCell style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
                    {lead.rawMessage}
                  </TableCell>
                  <TableCell>{renderConfidence(lead.confidence || 0)}</TableCell>
                  <TableCell style={{ maxWidth: '200px' }}>
                    {lead.keywords?.map((keyword, i) => (
                      <Chip 
                        key={i} 
                        label={keyword} 
                        size="small" 
                        variant="outlined"
                        style={{ margin: '2px' }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={lead.status || 'New'} 
                      color={lead.status === 'Handled' ? 'success' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {lead.status !== 'Handled' && (
                      <IconButton 
                        size="small" 
                        color="success"
                        onClick={() => handleMarkAsHandled(lead.id)}
                        title="Mark as handled"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    )}
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => {
                        // Mark as "Not a Lead"
                        leadStorage.updateLead(lead.id, { 
                          status: 'Not a Lead',
                          userFeedback: true
                        });
                        loadLeads();
                      }}
                      title="Not a lead"
                    >
                      <CancelIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No SMS leads found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
};

export default SmsLeadsPage;
