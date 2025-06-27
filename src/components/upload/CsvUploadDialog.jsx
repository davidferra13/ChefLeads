import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const CsvUploadDialog = ({ open, onClose, onSuccess, onError }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseResult, setParseResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setParseResult(null);
    } else if (selectedFile) {
      onError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    // Simulate file upload with progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const next = prev + Math.random() * 20;
        if (next >= 100) {
          clearInterval(interval);
          simulateProcessing();
          return 100;
        }
        return next;
      });
    }, 500);
  };
  
  const simulateProcessing = () => {
    // Simulate CSV processing delay
    setTimeout(() => {
      // For demo purposes, generate random parse results
      const recordCount = Math.floor(Math.random() * 20) + 5;
      const successCount = Math.floor(Math.random() * recordCount);
      const errorCount = recordCount - successCount;
      
      setParseResult({
        recordCount,
        successCount,
        errorCount,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`
      });
      
      setUploading(false);
      
      // If at least some records were successful, mark as success
      if (successCount > 0) {
        onSuccess({
          email: `csv@${file.name.replace('.csv', '')}`,
          token: `manual-import-${Date.now()}`,
          recordsImported: successCount,
          totalRecords: recordCount,
          name: file.name
        });
      } else {
        onError('No valid records found in CSV file');
      }
    }, 1500);
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setUploadProgress(0);
      setParseResult(null);
      onClose();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
      setParseResult(null);
    } else {
      onError('Please drop a valid CSV file');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={uploading ? undefined : handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Import Leads from CSV
      </DialogTitle>
      <DialogContent>
        {uploading ? (
          <Box sx={{ width: '100%', py: 4 }}>
            <Typography variant="body1" align="center" gutterBottom>
              Uploading {file.name}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ height: 10, borderRadius: 5, my: 2 }}
            />
            <Typography variant="body2" color="text.secondary" align="center">
              {Math.round(uploadProgress)}% complete
            </Typography>
          </Box>
        ) : parseResult ? (
          <Box sx={{ width: '100%', py: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              mb: 2
            }}>
              {parseResult.errorCount === 0 ? (
                <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
              ) : (
                <CheckCircleIcon color="warning" sx={{ fontSize: 48, mb: 1 }} />
              )}
              <Typography variant="h6">
                Import Complete
              </Typography>
            </Box>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <FileUploadIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="File" 
                  secondary={`${parseResult.fileName} (${parseResult.fileSize})`} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Successfully Imported" 
                  secondary={`${parseResult.successCount} records`} 
                />
              </ListItem>
              {parseResult.errorCount > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Failed to Import" 
                    secondary={`${parseResult.errorCount} records had invalid data`} 
                  />
                </ListItem>
              )}
            </List>
          </Box>
        ) : (
          <Box 
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 4,
              my: 2,
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv"
              onChange={handleFileSelect}
            />
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {file ? file.name : 'Select a CSV File'}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {file 
                ? `${(file.size / 1024).toFixed(2)} KB selected` 
                : 'Drag and drop a CSV file here or click to browse'
              }
            </Typography>
            <Button 
              variant="contained" 
              component="span"
              startIcon={<FileUploadIcon />}
              sx={{ mt: 1 }}
            >
              Browse Files
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          {parseResult ? 'Close' : 'Cancel'}
        </Button>
        {file && !parseResult && !uploading && (
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            startIcon={<FileUploadIcon />}
          >
            Upload & Process
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CsvUploadDialog;
