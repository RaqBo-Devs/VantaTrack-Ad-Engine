import express from 'express';
import { storage } from '../storage.js';
import { hashPassword } from '../auth.js';
import { createHash } from 'crypto';

const router = express.Router();

// Helper function to hash invite code for lookup
function hashInviteCode(code) {
  return createHash('sha256').update(code).digest('hex');
}

// GET /api/invite/:code - Verify invite code and return client details
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Hash the provided code to match stored hash
    const codeHash = hashInviteCode(code);
    
    // Look up invite by hash
    const invite = await storage.getInviteByCodeHash(codeHash);
    
    if (!invite) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if invite has expired
    if (new Date() > new Date(invite.expiresAt)) {
      return res.status(410).json({ error: 'Invite code has expired' });
    }

    // Check if invite has already been used
    if (invite.usedAt) {
      return res.status(410).json({ error: 'Invite code has already been used' });
    }

    // Return client details without sensitive information
    res.json({
      valid: true,
      clientName: invite.clientName,
      invitedEmail: invite.invitedEmail,
      role: invite.role,
      permissions: {
        portalAccess: invite.portalAccess,
        googleAccess: invite.googleAccess,
        facebookAccess: invite.facebookAccess
      },
      expiresAt: invite.expiresAt
    });

  } catch (error) {
    console.error('Error verifying invite code:', error);
    res.status(500).json({ error: 'Failed to verify invite code' });
  }
});

// POST /api/invite/:code/activate - Create user account and activate invite
router.post('/:code/activate', async (req, res) => {
  try {
    const { code } = req.params;
    const { password, fullName } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    if (!password || !fullName) {
      return res.status(400).json({ error: 'Password and full name are required' });
    }

    // Validate password strength (basic validation)
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Hash the provided code to match stored hash
    const codeHash = hashInviteCode(code);
    
    // Look up invite by hash
    const invite = await storage.getInviteByCodeHash(codeHash);
    
    if (!invite) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if invite has expired
    if (new Date() > new Date(invite.expiresAt)) {
      return res.status(410).json({ error: 'Invite code has expired' });
    }

    // Check if invite has already been used
    if (invite.usedAt) {
      return res.status(410).json({ error: 'Invite code has already been used' });
    }

    // Check if user with this email already exists
    const existingUser = await storage.getUserByEmail(invite.invitedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user account
    const user = await storage.createUser({
      email: invite.invitedEmail,
      passwordHash: await hashPassword(password),
      fullName,
      role: invite.role,
      agencyId: invite.agencyId,
      clientId: invite.clientId,
      isActive: true
    });

    // Mark invite as used
    await storage.markInviteAsUsed(invite.id);

    // Update client status to active
    await storage.updateClient(invite.clientId, { status: 'active' });

    // Log the account activation activity
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    await storage.logUserActivity(user.id, ipAddress, userAgent, 'invite_activation');

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        clientName: invite.clientName
      }
    });

  } catch (error) {
    console.error('Error activating invite:', error);
    res.status(500).json({ error: 'Failed to activate invite' });
  }
});

export default router;