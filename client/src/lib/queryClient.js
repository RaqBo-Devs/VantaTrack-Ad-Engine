import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// API request helper
export async function apiRequest(method, url, data = null) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add JWT Authorization header if token exists
  const token = localStorage.getItem('vantatrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = new Error(`HTTP Error: ${response.status}`);
    error.status = response.status;
    error.response = response;
    throw error;
  }
  
  return response;
}

// Query function factory with 401 handling
export function getQueryFn(options = {}) {
  return async ({ queryKey }) => {
    try {
      const response = await apiRequest('GET', queryKey[0]);
      return await response.json();
    } catch (error) {
      if (error.status === 401 && options.on401 === 'returnNull') {
        return null;
      }
      throw error;
    }
  };
}