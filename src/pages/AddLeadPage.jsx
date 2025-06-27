import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  MenuItem, 
  Box, 
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useLeads } from '../context/LeadsContext';
import Navigation from '../components/Navigation';
import { format } from 'date-fns';

// Status options for leads
const statusOptions = [
  { value: 'New', label: 'New' },
  { value: 'Follow Up', label: 'Follow Up' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Stale', label: 'Stale' },
];

const AddLeadPage = ({ editMode = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addLead, updateLead, getLeadById } = useLeads();
  
  // Form state initialization
  const [formData, setFormData] = useState({
    host: '',
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '12:00',
    location: '',
    guestCount: '',
    servingTime: '',
    allergies: '',
    dietaryRestrictions: '',
    menuDetails: '',
    specialRequests: '',
    eventTheme: '',
    feedbackNotes: '',
    status: 'New',
  });

  const [errors, setErrors] = useState({});

  // Load existing lead data in edit mode
  useEffect(() => {
    if (editMode && id) {
      const existingLead = getLeadById(parseInt(id));
      if (existingLead) {
        const formattedLead = {
          ...existingLead,
          date: existingLead.date ? format(new Date(existingLead.date), 'yyyy-MM-dd') : '',
          time: existingLead.time || '12:00',
        };
        setFormData(formattedLead);
      }
    }
  }, [editMode, id, getLeadById]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Form validation
  const validate = () => {
    const newErrors = {};
    if (!formData.host.trim()) newErrors.host = 'Host name is required';
    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const leadData = {
      ...formData,
      id: editMode ? parseInt(id) : Date.now(),
      guestCount: parseInt(formData.guestCount) || 0,
      createdAt: editMode ? formData.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editMode) {
        updateLead(leadData);
      } else {
        addLead(leadData);
      }
      navigate('/leads');
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navigation />
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => navigate('/leads')} 
            sx={{ color: 'primary.main' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {editMode ? 'Edit Lead' : 'Add New Lead'}
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Event Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Host Name"
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                  error={!!errors.host}
                  helperText={errors.host}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Event Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Event Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  error={!!errors.date}
                  helperText={errors.date}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Event Time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  error={!!errors.location}
                  helperText={errors.location}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Guest Count"
                  name="guestCount"
                  type="number"
                  value={formData.guestCount}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              {/* Event Details */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main' }}>
                  Event Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Serving Time"
                  name="servingTime"
                  value={formData.servingTime}
                  onChange={handleChange}
                  placeholder="e.g., 6:00 PM"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Event Theme"
                  name="eventTheme"
                  value={formData.eventTheme}
                  onChange={handleChange}
                  placeholder="e.g., Birthday, Corporate, Wedding"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Menu Details"
                  name="menuDetails"
                  value={formData.menuDetails}
                  onChange={handleChange}
                  placeholder="Describe the desired menu or cuisine preferences..."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="List any known allergies..."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Dietary Restrictions"
                  name="dietaryRestrictions"
                  value={formData.dietaryRestrictions}
                  onChange={handleChange}
                  placeholder="Vegetarian, vegan, gluten-free, etc..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Special Requests"
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  placeholder="Any special requests or additional details..."
                />
              </Grid>

              {/* Status and Notes */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main' }}>
                  Status & Notes
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label="Status"
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Feedback & Notes"
                  name="feedbackNotes"
                  value={formData.feedbackNotes}
                  onChange={handleChange}
                  placeholder="Add any feedback, notes, or follow-up information..."
                />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  justifyContent: 'flex-end',
                  mt: 3 
                }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate('/leads')}
                    size="large"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    size="large"
                  >
                    {editMode ? 'Update Lead' : 'Save Lead'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default AddLeadPage;
