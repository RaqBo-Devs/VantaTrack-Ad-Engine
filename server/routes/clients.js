import express from 'express';
import { storage } from '../storage.js';
import { verifyAgencyAccess, verifyClientAccess, canCreateClients, requireRole } from '../middleware/authorization.js';

const router = express.Router();

// Get clients by agency
router.get('/agency/:agencyId', verifyAgencyAccess, async (req, res) => {
  try {
    const { agencyId } = req.params;
    const clients = await storage.getClientsByAgency(parseInt(agencyId));
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get single client
router.get('/:clientId', verifyClientAccess, async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await storage.getClient(parseInt(clientId));
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create new client
router.post('/', canCreateClients, async (req, res) => {
  try {
    const clientData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const client = await storage.createClient(clientData);
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client permissions
router.patch('/:clientId/permissions', verifyClientAccess, requireRole('agency_admin', 'portal_owner'), async (req, res) => {
  try {
    const { clientId } = req.params;
    const { portalAccess, googleAccess, facebookAccess } = req.body;
    
    const updatedClient = await storage.updateClientPermissions(parseInt(clientId), {
      portalAccess: Boolean(portalAccess),
      googleAccess: Boolean(googleAccess),
      facebookAccess: Boolean(facebookAccess)
    });
    
    if (!updatedClient) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client permissions:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// Get client dashboard metrics
router.get('/:clientId/metrics', verifyClientAccess, async (req, res) => {
  try {
    const { clientId } = req.params;
    const metrics = await storage.getDashboardMetrics(parseInt(clientId));
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get upload history for client
router.get('/:clientId/uploads', verifyClientAccess, async (req, res) => {
  try {
    const { clientId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const uploads = await storage.getUploadHistory(parseInt(clientId), limit);
    res.json(uploads);
  } catch (error) {
    console.error('Error fetching upload history:', error);
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

export default router;