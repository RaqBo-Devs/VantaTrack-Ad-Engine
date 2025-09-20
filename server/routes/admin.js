import express from 'express';
import { storage } from '../storage.js';
import { hashPassword } from '../auth.js';
import { randomBytes, createHash } from 'crypto';
import { db } from '../storage.js';
import { 
  vantatrackPlacements, 
  vantatrackSites, 
  vantatrackPublishers 
} from '../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Middleware to require admin role
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'agency_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Helper function to generate secure invite code
function generateInviteCode() {
  return randomBytes(32).toString('hex');
}

// Helper function to hash invite code for storage
function hashInviteCode(code) {
  return createHash('sha256').update(code).digest('hex');
}

// GET /admin/clients - List all clients with invite status
router.get('/clients', requireAdmin, async (req, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(403).json({ error: 'Agency ID required for admin access' });
    }
    
    const agencyId = req.user.agencyId;
    
    // Get clients and their invite information
    const clients = await storage.getClientsWithInviteStatus(agencyId);
    
    // Get actual pending invites count
    const pendingInvites = await storage.getPendingInvites(agencyId);
    
    res.json({
      clients,
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
      pendingInvites: pendingInvites.length
    });
  } catch (error) {
    console.error('Error fetching admin clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// POST /admin/clients - Create client and send invite
router.post('/clients', requireAdmin, async (req, res) => {
  try {
    const {
      clientName,
      contactEmail,
      phone,
      portalAccess = false,
      googleAccess = false,
      facebookAccess = false,
      monthlyPackageBdt,
      contractStartDate,
      notes
    } = req.body;

    // Validation
    if (!clientName || !contactEmail) {
      return res.status(400).json({ error: 'Client name and contact email are required' });
    }

    // Check if email already exists
    const existingUser = await storage.getUserByEmail(contactEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists in the system' });
    }

    if (!req.user?.agencyId) {
      return res.status(403).json({ error: 'Agency ID required for admin access' });
    }
    
    const agencyId = req.user.agencyId;
    
    // Create client record
    const client = await storage.createClient({
      clientName,
      agencyId,
      portalAccess,
      googleAccess,
      facebookAccess,
      contactEmail,
      phone,
      monthlyPackageBdt,
      contractStartDate,
      notes,
      status: 'invited'
    });

    // Generate invite code and hash it
    const inviteCode = generateInviteCode();
    const codeHash = hashInviteCode(inviteCode);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invite record
    await storage.createInvite({
      codeHash,
      clientId: client.id,
      invitedEmail: contactEmail,
      role: 'client_admin',
      portalAccess,
      googleAccess,
      facebookAccess,
      packageAmountBdt: monthlyPackageBdt,
      contractStartDate,
      notes,
      expiresAt,
      createdByUserId: req.user.id
    });

    res.status(201).json({
      message: 'Client created and invite sent successfully',
      client: {
        ...client,
        inviteCode, // Return the actual code for admin to share
        inviteExpiry: expiresAt
      }
    });

  } catch (error) {
    console.error('Error creating client and invite:', error);
    res.status(500).json({ error: 'Failed to create client and invite' });
  }
});

// PATCH /admin/clients/:id - Edit client information
router.patch('/clients/:id', requireAdmin, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const updates = req.body;

    // Validate client exists and belongs to admin's agency
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (!req.user?.agencyId) {
      return res.status(403).json({ error: 'Agency ID required for admin access' });
    }
    
    if (client.agencyId !== req.user.agencyId) {
      return res.status(403).json({ error: 'Access denied to this client' });
    }

    // Whitelist allowed fields to prevent unauthorized changes
    const allowedFields = {
      clientName: updates.clientName,
      contactEmail: updates.contactEmail,
      phone: updates.phone,
      portalAccess: updates.portalAccess,
      googleAccess: updates.googleAccess,
      facebookAccess: updates.facebookAccess,
      monthlyPackageBdt: updates.monthlyPackageBdt,
      contractStartDate: updates.contractStartDate,
      notes: updates.notes,
      status: updates.status
    };
    
    // Remove undefined fields
    const filteredUpdates = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
    );

    // Update client with whitelisted fields only
    const updatedClient = await storage.updateClient(clientId, filteredUpdates);

    res.json({
      message: 'Client updated successfully',
      client: updatedClient
    });

  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// POST /admin/clients/:id/invite/regenerate - Regenerate invite code
router.post('/clients/:id/invite/regenerate', requireAdmin, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);

    // Validate client exists and belongs to admin's agency
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (!req.user?.agencyId) {
      return res.status(403).json({ error: 'Agency ID required for admin access' });
    }
    
    if (client.agencyId !== req.user.agencyId) {
      return res.status(403).json({ error: 'Access denied to this client' });
    }

    // Generate new invite code
    const inviteCode = generateInviteCode();
    const codeHash = hashInviteCode(inviteCode);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update or create new invite with all required fields
    await storage.regenerateInvite(clientId, {
      codeHash,
      invitedEmail: client.contactEmail,
      role: 'client_admin',
      portalAccess: client.portalAccess,
      googleAccess: client.googleAccess,
      facebookAccess: client.facebookAccess,
      packageAmountBdt: client.monthlyPackageBdt,
      contractStartDate: client.contractStartDate,
      notes: client.notes,
      expiresAt,
      createdByUserId: req.user.id
    });

    res.json({
      message: 'Invite code regenerated successfully',
      inviteCode,
      inviteExpiry: expiresAt,
      clientName: client.clientName
    });

  } catch (error) {
    console.error('Error regenerating invite:', error);
    res.status(500).json({ error: 'Failed to regenerate invite code' });
  }
});

// GET /admin/invites - List all pending invites
router.get('/invites', requireAdmin, async (req, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(403).json({ error: 'Agency ID required for admin access' });
    }
    
    const agencyId = req.user.agencyId;
    const invites = await storage.getPendingInvites(agencyId);
    
    res.json({
      invites,
      totalPending: invites.length
    });
  } catch (error) {
    console.error('Error fetching pending invites:', error);
    res.status(500).json({ error: 'Failed to fetch pending invites' });
  }
});

// ==== AD PLACEMENT MANAGEMENT ====

// GET /admin/placements - List all placements
router.get('/placements', requireAdmin, async (req, res) => {
  try {
    const placements = await db
      .select({
        id: vantatrackPlacements.id,
        placementKey: vantatrackPlacements.placementKey,
        placementName: vantatrackPlacements.placementName,
        adSize: vantatrackPlacements.adSize,
        position: vantatrackPlacements.position,
        status: vantatrackPlacements.status,
        siteName: vantatrackSites.siteName,
        domain: vantatrackSites.domain,
        publisherName: vantatrackPublishers.publisherName,
        createdAt: vantatrackPlacements.createdAt
      })
      .from(vantatrackPlacements)
      .leftJoin(vantatrackSites, eq(vantatrackPlacements.siteId, vantatrackSites.id))
      .leftJoin(vantatrackPublishers, eq(vantatrackSites.publisherId, vantatrackPublishers.id))
      .orderBy(desc(vantatrackPlacements.createdAt));

    res.json({
      placements,
      totalPlacements: placements.length
    });
  } catch (error) {
    console.error('Error fetching placements:', error);
    res.status(500).json({ error: 'Failed to fetch placements' });
  }
});

// POST /admin/placements - Create new placement
router.post('/placements', requireAdmin, async (req, res) => {
  try {
    const {
      publisherName,
      domain,
      siteName,
      siteUrl,
      placementName,
      adSize,
      position
    } = req.body;

    // Validation
    if (!publisherName || !domain || !siteName || !placementName) {
      return res.status(400).json({ 
        error: 'Publisher name, domain, site name, and placement name are required' 
      });
    }

    // Check if publisher exists, create if not
    let publisher = await db
      .select()
      .from(vantatrackPublishers)
      .where(eq(vantatrackPublishers.domain, domain))
      .limit(1);

    if (!publisher.length) {
      // Create new publisher
      const newPublisher = await db
        .insert(vantatrackPublishers)
        .values({
          publisherName,
          domain,
          contactEmail: `admin@${domain}`,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      publisher = newPublisher;
    } else {
      publisher = publisher[0];
    }

    // Check if site exists, create if not
    let site = await db
      .select()
      .from(vantatrackSites)
      .where(eq(vantatrackSites.domain, domain))
      .limit(1);

    if (!site.length) {
      // Create new site
      const newSite = await db
        .insert(vantatrackSites)
        .values({
          publisherId: publisher[0]?.id || publisher.id,
          siteName,
          domain,
          siteUrl: siteUrl || `https://www.${domain}`,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      site = newSite;
    } else {
      site = site[0];
    }

    // Generate placement key
    const placementKey = `${domain.replace(/\./g, '-')}-${position}-${adSize}`;

    // Create placement
    const placement = await db
      .insert(vantatrackPlacements)
      .values({
        siteId: site[0]?.id || site.id,
        placementKey,
        placementName,
        adSize,
        position,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.status(201).json({
      message: 'Placement created successfully',
      placement: placement[0],
      publisherName,
      siteName,
      domain,
      placementKey
    });

  } catch (error) {
    console.error('Error creating placement:', error);
    res.status(500).json({ error: 'Failed to create placement' });
  }
});

// PUT /admin/placements/:id - Update placement
router.put('/placements/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { placementName, status } = req.body;

    const updatedPlacement = await db
      .update(vantatrackPlacements)
      .set({
        placementName,
        status,
        updatedAt: new Date()
      })
      .where(eq(vantatrackPlacements.id, parseInt(id)))
      .returning();

    if (!updatedPlacement.length) {
      return res.status(404).json({ error: 'Placement not found' });
    }

    res.json({
      message: 'Placement updated successfully',
      placement: updatedPlacement[0]
    });

  } catch (error) {
    console.error('Error updating placement:', error);
    res.status(500).json({ error: 'Failed to update placement' });
  }
});

// DELETE /admin/placements/:id - Delete placement
router.delete('/placements/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPlacement = await db
      .delete(vantatrackPlacements)
      .where(eq(vantatrackPlacements.id, parseInt(id)))
      .returning();

    if (!deletedPlacement.length) {
      return res.status(404).json({ error: 'Placement not found' });
    }

    res.json({
      message: 'Placement deleted successfully',
      placement: deletedPlacement[0]
    });

  } catch (error) {
    console.error('Error deleting placement:', error);
    res.status(500).json({ error: 'Failed to delete placement' });
  }
});

export default router;