import { useState, useEffect } from 'react';

// Custom hook to manage platform connections
const useConnections = () => {
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});

  // Load saved connections from localStorage on mount
  useEffect(() => {
    const savedConnections = localStorage.getItem('platformConnections');
    if (savedConnections) {
      try {
        setConnections(JSON.parse(savedConnections));
      } catch (err) {
        console.error('Failed to parse saved connections', err);
      }
    }
  }, []);

  // Save connections to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(connections).length) {
      localStorage.setItem('platformConnections', JSON.stringify(connections));
    }
  }, [connections]);

  // Connect a platform with account data
  const connect = (platformId, accountData) => {
    setConnections(prev => ({
      ...prev,
      [platformId]: {
        ...accountData,
        connectedAt: new Date().toISOString()
      }
    }));
    setLoading(prev => ({ ...prev, [platformId]: false }));
    setError(prev => ({ ...prev, [platformId]: null }));
  };

  // Disconnect a platform
  const disconnect = (platformId) => {
    setConnections(prev => {
      const newConnections = { ...prev };
      delete newConnections[platformId];
      
      // If we end up with an empty object, clean up localStorage
      if (Object.keys(newConnections).length === 0) {
        localStorage.removeItem('platformConnections');
      }
      
      return newConnections;
    });
  };

  // Start loading for a platform
  const startLoading = (platformId) => {
    setLoading(prev => ({ ...prev, [platformId]: true }));
    setError(prev => ({ ...prev, [platformId]: null }));
  };

  // Set error for a platform
  const setConnectionError = (platformId, errorMessage) => {
    setLoading(prev => ({ ...prev, [platformId]: false }));
    setError(prev => ({ ...prev, [platformId]: errorMessage }));
  };

  // Check if a platform is connected
  const isConnected = (platformId) => {
    return !!connections[platformId];
  };

  // Get connection data for a platform
  const getConnection = (platformId) => {
    return connections[platformId] || null;
  };

  return {
    connections,
    loading,
    error,
    connect,
    disconnect,
    startLoading,
    setConnectionError,
    isConnected,
    getConnection
  };
};

export default useConnections;
