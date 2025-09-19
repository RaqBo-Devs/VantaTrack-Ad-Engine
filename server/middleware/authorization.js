import { storage } from '../storage.js';

// Middleware to verify client belongs to user's agency
export const verifyClientAccess = async (req, res, next) => {
  try {
    const clientId = req.params.clientId || req.body.clientId;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const client = await storage.getClient(parseInt(clientId));
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if user has access to this client
    const userRole = req.user.role;
    const userAgencyId = req.user.agencyId;

    // Agency admins can access all clients in their agency
    if (userRole === 'agency_admin' && client.agencyId === userAgencyId) {
      req.authorizedClient = client;
      return next();
    }

    // Portal owners can access clients in any agency (for now)
    if (userRole === 'portal_owner') {
      req.authorizedClient = client;
      return next();
    }

    // Client users and admins can only access their own client
    if ((userRole === 'client_user' || userRole === 'client_admin')) {
      // Get user's client associations
      const userClients = await storage.getClientsByUser(req.user.id);
      const hasAccess = userClients.some(c => c.id === client.id);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this client' });
      }
      
      req.authorizedClient = client;
      return next();
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  } catch (error) {
    console.error('Client authorization error:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Middleware to verify agency access
export const verifyAgencyAccess = async (req, res, next) => {
  try {
    const agencyId = req.params.agencyId || req.body.agencyId;
    
    if (!agencyId) {
      return res.status(400).json({ error: 'Agency ID is required' });
    }

    const userRole = req.user.role;
    const userAgencyId = req.user.agencyId;

    // Agency admins can only access their own agency
    if (userRole === 'agency_admin' && userAgencyId === parseInt(agencyId)) {
      return next();
    }

    // Portal owners can access any agency
    if (userRole === 'portal_owner') {
      return next();
    }

    return res.status(403).json({ error: 'Access denied to this agency' });
  } catch (error) {
    console.error('Agency authorization error:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Middleware to require specific roles
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware to verify platform access permissions
export const verifyPlatformAccess = (platform) => {
  return async (req, res, next) => {
    try {
      if (!req.authorizedClient) {
        return res.status(400).json({ error: 'Client authorization required first' });
      }

      const client = req.authorizedClient;
      
      switch (platform) {
        case 'portal':
          if (!client.portalAccess) {
            return res.status(403).json({ error: 'Portal access not enabled for this client' });
          }
          break;
        case 'google':
          if (!client.googleAccess) {
            return res.status(403).json({ error: 'Google Ads access not enabled for this client' });
          }
          break;
        case 'facebook':
          if (!client.facebookAccess) {
            return res.status(403).json({ error: 'Facebook Ads access not enabled for this client' });
          }
          break;
        default:
          return res.status(400).json({ error: 'Invalid platform specified' });
      }

      next();
    } catch (error) {
      console.error('Platform access error:', error);
      return res.status(500).json({ error: 'Platform access check failed' });
    }
  };
};

// Helper to check if user can create clients
export const canCreateClients = (req, res, next) => {
  const allowedRoles = ['agency_admin', 'portal_owner'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Only agency admins and portal owners can create clients' 
    });
  }
  
  next();
};