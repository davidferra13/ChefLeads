/**
 * Service Connections Utility
 * Manages the persistence and state of service connections
 */

const STORAGE_KEY = 'windsurf-service-connections';

/**
 * Load saved service connection states from localStorage
 * @returns {Object} Object with service IDs as keys and connection status as boolean values
 */
export const loadServiceConnections = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : {};
  } catch (error) {
    console.error('Error loading service connections from localStorage:', error);
    return {};
  }
};

/**
 * Save service connection states to localStorage
 * @param {Object} connectionStates Object with service IDs as keys and connection status as values
 */
export const saveServiceConnections = (connectionStates) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connectionStates));
    return true;
  } catch (error) {
    console.error('Error saving service connections to localStorage:', error);
    return false;
  }
};

/**
 * Update a single service connection state
 * @param {string} serviceId ID of the service to update
 * @param {boolean} isConnected New connection state
 * @returns {Object} Updated connection states object
 */
export const updateServiceConnection = (serviceId, isConnected) => {
  const currentStates = loadServiceConnections();
  const updatedStates = {
    ...currentStates,
    [serviceId]: isConnected
  };
  
  saveServiceConnections(updatedStates);
  return updatedStates;
};

/**
 * Apply saved connection states to services array
 * @param {Array} services Array of service objects
 * @returns {Array} Updated services array with connection states applied
 */
export const applyConnectionStates = (services) => {
  const savedStates = loadServiceConnections();
  
  return services.map(service => ({
    ...service,
    isConnected: savedStates[service.id] !== undefined ? savedStates[service.id] : service.isConnected
  }));
};
