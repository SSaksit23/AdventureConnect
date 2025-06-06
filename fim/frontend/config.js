// Frontend API Configuration
const config = {
  // API Base URL - Change this based on your deployment
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://saksit-saelow-project.appspot.com/api'  // Google App Engine URL
    : 'http://localhost:8080/api',                // Local development

  // API Endpoints
  ENDPOINTS: {
    FLIGHTS: '/flights',
    PNR: '/pnr',
    HEALTH: '/health'
  },

  // Request configuration
  REQUEST_CONFIG: {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },

  // Retry configuration
  RETRY: {
    attempts: 3,
    delay: 1000
  }
};

// API Helper Functions
const api = {
  // Base fetch wrapper with error handling
  async request(endpoint, options = {}) {
    const url = `${config.API_BASE_URL}${endpoint}`;
    const requestOptions = {
      ...config.REQUEST_CONFIG,
      ...options,
      headers: {
        ...config.REQUEST_CONFIG.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  // Flight API calls
  flights: {
    getAll: () => api.request(config.ENDPOINTS.FLIGHTS),
    getByPNR: (pnr) => api.request(`${config.ENDPOINTS.FLIGHTS}/pnr/${pnr}`),
    create: (flightData) => api.request(config.ENDPOINTS.FLIGHTS, {
      method: 'POST',
      body: JSON.stringify(flightData)
    }),
    update: (id, flightData) => api.request(`${config.ENDPOINTS.FLIGHTS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flightData)
    }),
    delete: (id) => api.request(`${config.ENDPOINTS.FLIGHTS}/${id}`, {
      method: 'DELETE'
    }),
    updateFromAmadeus: (id, flightData) => api.request(`${config.ENDPOINTS.FLIGHTS}/${id}/amadeus-update`, {
      method: 'POST',
      body: JSON.stringify(flightData)
    })
  },

  // PNR API calls
  pnr: {
    getAll: () => api.request(config.ENDPOINTS.PNR),
    getById: (pnr) => api.request(`${config.ENDPOINTS.PNR}/${pnr}`),
    create: (pnrData) => api.request(config.ENDPOINTS.PNR, {
      method: 'POST',
      body: JSON.stringify(pnrData)
    }),
    update: (pnr, pnrData) => api.request(`${config.ENDPOINTS.PNR}/${pnr}`, {
      method: 'PUT',
      body: JSON.stringify(pnrData)
    }),
    delete: (pnr) => api.request(`${config.ENDPOINTS.PNR}/${pnr}`, {
      method: 'DELETE'
    }),
    getStats: () => api.request(`${config.ENDPOINTS.PNR}/stats/summary`)
  },

  // Health check
  health: () => api.request('/health')
};

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.FlightAPI = api;
  window.FlightConfig = config;
}

// Export for Node.js (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { api, config };
} 