import express from 'express';
import { db } from '../storage.js';
import { 
  vantatrackPlacements, 
  vantatrackLineItems, 
  vantatrackCreatives,
  vantatrackSites,
  vantatrackPublishers,
  vantatrackCampaigns,
  vantatrackAdEvents,
  vantatrackClients
} from '../../shared/schema.js';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import crypto from 'crypto';

const router = express.Router();

// Nonce cleanup function (removes expired nonces from database)
async function cleanupExpiredNonces() {
  try {
    await db.execute(sql`DELETE FROM vantatrack_impression_nonces WHERE created_at < NOW() - INTERVAL '10 minutes'`);
  } catch (error) {
    console.error('Error cleaning up expired nonces:', error);
  }
}

// Generate signed impression token (cryptographic binding)
function generateImpressionToken(lineItemId, creativeId, placementId) {
  const nonce = crypto.randomBytes(8).toString('hex');
  const exp = Date.now() + (5 * 60 * 1000); // 5 minute expiry
  const payload = `${lineItemId}:${creativeId}:${placementId}:${exp}:${nonce}`;
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET).update(payload).digest('hex');
  return `${payload}:${signature}`;
}

// Validate signed impression token (prevent fraud) - Database-based nonce store
async function validateImpressionToken(token, lineItemId, creativeId, placementId) {
  try {
    const parts = token.split(':');
    if (parts.length !== 6) return false;
    
    const [li, c, p, exp, nonce, signature] = parts;
    
    // Check expiry
    if (Date.now() > parseInt(exp)) return false;
    
    // Verify signature
    const payload = `${li}:${c}:${p}:${exp}:${nonce}`;
    const expectedSig = crypto.createHmac('sha256', process.env.JWT_SECRET).update(payload).digest('hex');
    if (signature !== expectedSig) return false;
    
    // Check IDs match
    if (li !== lineItemId.toString() || c !== creativeId.toString() || p !== placementId.toString()) return false;
    
    // CRITICAL: Database-based nonce tracking (shared across instances, persistent)
    try {
      // Try to insert nonce - will fail if already exists (replay attempt)
      await db.execute(sql`INSERT INTO vantatrack_impression_nonces (nonce) VALUES (${nonce})`);
      
      // Cleanup expired nonces periodically (random 1% chance)
      if (Math.random() < 0.01) {
        setImmediate(() => cleanupExpiredNonces());
      }
      
      return true;
    } catch (dbError) {
      // Nonce already exists (replay attempt) or other DB error
      console.error('REPLAY ATTACK BLOCKED - Nonce already used:', nonce);
      return false;
    }
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

// Serve the JavaScript embed tag
router.get('/v1/tag.js', async (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.setHeader('Access-Control-Allow-Origin', '*');
  

  
  // Import fs and path for ES modules
  const { readFileSync } = await import('fs');
  const { join, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const tagPath = join(__dirname, '../public/ad/v1/tag.js');
  
  try {
    const tagContent = readFileSync(tagPath, 'utf8');
    res.send(tagContent);
  } catch (error) {
    res.status(500).send('// VantaTrack Ad Tag - Error loading');
  }
});

// Ad decision API - serves ads to placements
router.get('/v1/serve', async (req, res) => {
  const { placement, page, ref, ua, viewport } = req.query;
  
  if (!placement) {
    return res.status(400).send('<div>Error: Missing placement key</div>');
  }

  try {
    // Get placement details with site and publisher info
    const placementData = await db
      .select({
        placement: {
          id: vantatrackPlacements.id,
          siteId: vantatrackPlacements.siteId,
          adSize: vantatrackPlacements.adSize,
          floorPriceBdt: vantatrackPlacements.floorPriceBdt,
          placementKey: vantatrackPlacements.placementKey,
          status: vantatrackPlacements.status
        },
        site: {
          id: vantatrackSites.id,
          publisherId: vantatrackSites.publisherId,
          status: vantatrackSites.status
        },
        publisher: {
          id: vantatrackPublishers.id,
          status: vantatrackPublishers.status
        }
      })
      .from(vantatrackPlacements)
      .leftJoin(vantatrackSites, eq(vantatrackPlacements.siteId, vantatrackSites.id))
      .leftJoin(vantatrackPublishers, eq(vantatrackSites.publisherId, vantatrackPublishers.id))
      .where(and(
        eq(vantatrackPlacements.placementKey, placement),
        eq(vantatrackPlacements.status, 'active'),
        eq(vantatrackSites.status, 'active'),
        eq(vantatrackPublishers.status, 'active')
      ))
      .limit(1);

    if (!placementData.length) {
      return res.send('<div style="display:none;"><!-- No active placement found --></div>');
    }

    const { placement: placementInfo, site, publisher } = placementData[0];

    // Get active line items for this placement size with available budget
    const today = new Date().toISOString().split('T')[0];
    const eligibleLineItems = await db
      .select({
        lineItem: vantatrackLineItems,
        creative: vantatrackCreatives,
        campaign: vantatrackCampaigns,
        client: vantatrackClients
      })
      .from(vantatrackLineItems)
      .leftJoin(vantatrackCreatives, eq(vantatrackLineItems.creativeId, vantatrackCreatives.id))
      .leftJoin(vantatrackCampaigns, eq(vantatrackLineItems.campaignId, vantatrackCampaigns.id))
      .leftJoin(vantatrackClients, eq(vantatrackCampaigns.clientId, vantatrackClients.id))
      .where(and(
        eq(vantatrackLineItems.status, 'active'),
        eq(vantatrackCreatives.status, 'active'),
        eq(vantatrackCampaigns.status, 'active'),
        eq(vantatrackClients.isActive, true),
        eq(vantatrackCreatives.adSize, placementInfo.adSize),
        gte(vantatrackLineItems.bidCpmBdt, placementInfo.floorPriceBdt),
        // Date targeting
        lte(vantatrackLineItems.startDate, today),
        gte(vantatrackLineItems.endDate, today),
        // Budget check (only total budget for now - daily budget logic removed for deadline)
        sql`(${vantatrackLineItems.totalBudgetBdt} IS NULL OR ${vantatrackLineItems.spentBdt} < ${vantatrackLineItems.totalBudgetBdt})`
      ))
      .orderBy(desc(vantatrackLineItems.bidCpmBdt), desc(vantatrackLineItems.weight));

    if (!eligibleLineItems.length) {
      return res.send('<div style="display:none;"><!-- No eligible ads --></div>');
    }

    // Simple weighted selection (take highest bidder for now)
    const selectedItem = eligibleLineItems[0];
    const { lineItem, creative, campaign, client } = selectedItem;

    // Generate cryptographically signed tracking URLs
    const impressionToken = generateImpressionToken(lineItem.id, creative.id, placementInfo.id);
    const impressionUrl = `/api/ad-serving/v1/i?li=${lineItem.id}&c=${creative.id}&p=${placementInfo.id}&t=${encodeURIComponent(impressionToken)}`;
    const clickUrl = `/api/ad-serving/v1/c?li=${lineItem.id}&c=${creative.id}&p=${placementInfo.id}`;

    // Detect device type
    const userAgent = ua || req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';

    // Impression will be logged when the pixel loads at /v1/i endpoint

    // Generate ad HTML
    const adHtml = generateAdHTML(creative, clickUrl, impressionUrl, placementInfo.adSize);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(adHtml);

  } catch (error) {
    console.error('Ad serving error:', error);
    res.send('<div style="display:none;"><!-- Ad serving error --></div>');
  }
});

// Impression tracking endpoint - Now handles actual impression logging and budget updates
router.all('/v1/i', async (req, res) => {
  const { li: lineItemId, c: creativeId, p: placementId, t: token } = req.query;
  
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Return 1x1 transparent GIF immediately
  const gif = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x04, 0x01, 0x00, 0x3B
  ]);
  
  res.send(gif);
  
  // Process impression logging asynchronously with token validation
  if (lineItemId && creativeId && placementId && token) {
    setImmediate(async () => {
      try {
        // CRITICAL: Validate signed token to prevent fraud
        if (!(await validateImpressionToken(token, parseInt(lineItemId), parseInt(creativeId), parseInt(placementId)))) {
          console.error('FRAUD ATTEMPT BLOCKED - Invalid or expired impression token:', { lineItemId, creativeId, placementId });
          return;
        }
        
        await processImpression(parseInt(lineItemId), parseInt(creativeId), parseInt(placementId), req);
      } catch (error) {
        console.error('Error processing impression:', error);
      }
    });
  } else {
    console.error('FRAUD ATTEMPT BLOCKED - Missing required parameters or token:', { lineItemId, creativeId, placementId, hasToken: !!token });
  }
});

// Click tracking endpoint
router.get('/v1/c', async (req, res) => {
  const { li: lineItemId, c: creativeId, p: placementId } = req.query;
  
  if (lineItemId && creativeId && placementId) {
    try {
      // Get creative info to validate and get the stored click URL
      const creativeData = await db
        .select({
          creative: {
            id: vantatrackCreatives.id,
            clickUrl: vantatrackCreatives.clickUrl,
            status: vantatrackCreatives.status
          }
        })
        .from(vantatrackCreatives)
        .where(eq(vantatrackCreatives.id, parseInt(creativeId)))
        .limit(1);

      if (!creativeData.length || creativeData[0].creative.status !== 'active') {
        return res.status(400).send('Invalid click tracking request');
      }

      const { creative } = creativeData[0];
      
      // Get placement info for logging
      const placementData = await db
        .select({
          placement: {
            id: vantatrackPlacements.id,
            siteId: vantatrackPlacements.siteId,
            status: vantatrackPlacements.status
          },
          site: {
            id: vantatrackSites.id,
            publisherId: vantatrackSites.publisherId,
            status: vantatrackSites.status
          },
          publisher: {
            id: vantatrackPublishers.id,
            status: vantatrackPublishers.status
          }
        })
        .from(vantatrackPlacements)
        .leftJoin(vantatrackSites, eq(vantatrackPlacements.siteId, vantatrackSites.id))
        .leftJoin(vantatrackPublishers, eq(vantatrackSites.publisherId, vantatrackPublishers.id))
        .where(eq(vantatrackPlacements.id, parseInt(placementId)))
        .limit(1);

      if (placementData.length) {
        const { placement, site, publisher } = placementData[0];
        
        // Get line item and campaign info
        const lineItemData = await db
          .select({
            lineItem: {
              id: vantatrackLineItems.id,
              campaignId: vantatrackLineItems.campaignId,
              creativeId: vantatrackLineItems.creativeId,
              status: vantatrackLineItems.status
            },
            campaign: {
              id: vantatrackCampaigns.id,
              clientId: vantatrackCampaigns.clientId,
              status: vantatrackCampaigns.status
            }
          })
          .from(vantatrackLineItems)
          .leftJoin(vantatrackCampaigns, eq(vantatrackLineItems.campaignId, vantatrackCampaigns.id))
          .where(eq(vantatrackLineItems.id, parseInt(lineItemId)))
          .limit(1);

        if (lineItemData.length) {
          const { lineItem, campaign } = lineItemData[0];
          
          // Validate that the line item matches the creative (prevent tampering)
          if (lineItem.creativeId !== parseInt(creativeId)) {
            return res.status(400).send('Invalid click tracking request');
          }
          
          // Log click event
          logAdEvent('click', {
            placementId: placement.id,
            creativeId: parseInt(creativeId),
            lineItemId: lineItem.id,
            campaignId: campaign.id,
            clientId: campaign.clientId,
            siteId: site.id,
            publisherId: publisher.id,
            userIp: req.ip,
            userAgent: req.headers['user-agent'] || '',
            referrer: req.headers.referer || '',
            deviceType: /Mobile|Android|iPhone|iPad/i.test(req.headers['user-agent'] || '') ? 'mobile' : 'desktop',
            revenueBdt: 0 // Clicks don't generate revenue directly
          });
          
          // Redirect to the validated creative click URL
          return res.redirect(creative.clickUrl);
        }
      }
    } catch (error) {
      console.error('Click tracking error:', error);
    }
  }
  
  // If we get here, something went wrong
  res.status(400).send('Invalid click tracking request');
});

// Process impression with budget enforcement (simplified for deadline)
async function processImpression(lineItemId, creativeId, placementId, req) {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = /Mobile|Android|iPhone|iPad/i.test(userAgent) ? 'mobile' : 'desktop';
    
    // Basic validation and cost calculation
    const lineItem = await db.select().from(vantatrackLineItems).where(eq(vantatrackLineItems.id, lineItemId)).limit(1);
    if (!lineItem.length) return;

    const creative = await db.select().from(vantatrackCreatives).where(eq(vantatrackCreatives.id, creativeId)).limit(1);
    if (!creative.length) return;

    const campaign = await db.select().from(vantatrackCampaigns).where(eq(vantatrackCampaigns.id, lineItem[0].campaignId)).limit(1);
    if (!campaign.length) return;

    const placement = await db.select().from(vantatrackPlacements).where(eq(vantatrackPlacements.id, placementId)).limit(1);
    if (!placement.length) return;

    const site = await db.select().from(vantatrackSites).where(eq(vantatrackSites.id, placement[0].siteId)).limit(1);
    if (!site.length) return;

    // Enhanced validation to prevent fraud
    if (!creative[0] || !lineItem[0] || !campaign[0] || !placement[0] || !site[0]) {
      console.error('Missing required data for impression validation');
      return;
    }

    // CRITICAL: Verify creative belongs to line item (prevents fraud!)
    if (lineItem[0].creativeId !== parseInt(creativeId)) {
      console.error('FRAUD ATTEMPT BLOCKED - Creative does not belong to line item:', { 
        lineItemId, 
        creativeId, 
        expectedCreativeId: lineItem[0].creativeId 
      });
      return;
    }

    // Validate all entities are active (INCLUDING placement/site/publisher)
    if (lineItem[0].status !== 'active') {
      console.error('Line item is not active:', lineItemId);
      return;
    }

    if (campaign[0].status !== 'active') {
      console.error('Campaign is not active:', campaign[0].id);
      return;
    }

    if (creative[0].status !== 'active') {
      console.error('Creative is not active:', creativeId);
      return;
    }

    // CRITICAL: Validate placement/site/publisher are active (prevents fraud!)
    if (placement[0].status !== 'active') {
      console.error('FRAUD BLOCKED - Placement is not active:', placementId);
      return;
    }

    if (site[0].status !== 'active') {
      console.error('FRAUD BLOCKED - Site is not active:', site[0].id);
      return;
    }

    // Get publisher and validate it's active
    const publisher = await db.select().from(vantatrackPublishers).where(eq(vantatrackPublishers.id, site[0].publisherId)).limit(1);
    if (!publisher.length || publisher[0].status !== 'active') {
      console.error('FRAUD BLOCKED - Publisher is not active:', site[0].publisherId);
      return;
    }

    // Validate ad size compatibility (prevents placement mismatches)
    if (creative[0].adSize !== placement[0].adSize) {
      console.error('FRAUD BLOCKED - Ad size mismatch:', { 
        creativeSize: creative[0].adSize, 
        placementSize: placement[0].adSize 
      });
      return;
    }

    // Validate date range
    const today = new Date();
    const startDate = new Date(lineItem[0].startDate);
    const endDate = new Date(lineItem[0].endDate);
    
    if (today < startDate || today > endDate) {
      console.error('Line item outside date range:', { lineItemId, today, startDate, endDate });
      return;
    }

    const impressionCost = parseFloat(lineItem[0].bidCpmBdt) / 1000;
    const currentSpent = parseFloat(lineItem[0].spentBdt || 0);
    const newTotalSpent = currentSpent + impressionCost;

    // Atomic budget enforcement with conditional update inside transaction
    const updateResult = await db.transaction(async (tx) => {
      // Lock the row and conditionally update budget only if within limits
      const updateQuery = await tx.execute(sql`
        UPDATE vantatrack_line_items 
        SET spent_bdt = spent_bdt + ${impressionCost}
        WHERE id = ${lineItemId} 
        AND (total_budget_bdt IS NULL OR spent_bdt + ${impressionCost} <= total_budget_bdt)
        RETURNING spent_bdt, total_budget_bdt
      `);

      // If update didn't affect any rows, budget was exceeded
      if (updateQuery.rowCount === 0) {
        console.log(`Budget exceeded for line item ${lineItemId} - impression blocked`);
        return { success: false, reason: 'budget_exceeded' };
      }

      // Budget update successful, log the impression
      await tx.insert(vantatrackAdEvents).values({
        eventType: 'impression',
        placementId: placement[0].id,
        creativeId: creativeId,
        lineItemId: lineItem[0].id,
        campaignId: campaign[0].id,
        clientId: campaign[0].clientId,
        siteId: site[0].id,
        publisherId: site[0].publisherId,
        userIp: req.ip,
        userAgent: userAgent,
        referrer: req.headers.referer || '',
        deviceType,
        country: 'BD',
        revenueBdt: impressionCost
      });

      return { success: true, newSpent: updateQuery.rows[0].spent_bdt };
    });

    if (!updateResult.success) {
      return; // Impression was blocked due to budget
    }

    console.log(`Impression logged: line item ${lineItemId}, cost ${impressionCost} BDT`);
  } catch (error) {
    console.error('Error processing impression:', error);
  }
}

// Helper function to log ad events
async function logAdEvent(eventType, data) {
  try {
    await db.insert(vantatrackAdEvents).values({
      eventType,
      placementId: data.placementId,
      creativeId: data.creativeId,
      lineItemId: data.lineItemId,
      campaignId: data.campaignId,
      clientId: data.clientId,
      siteId: data.siteId,
      publisherId: data.publisherId,
      userIp: data.userIp,
      userAgent: data.userAgent,
      referrer: data.referrer,
      deviceType: data.deviceType,
      country: 'BD', // Default to Bangladesh for now
      revenueBdt: data.revenueBdt
    });
  } catch (error) {
    console.error('Error logging ad event:', error);
  }
}

// Helper function to generate ad HTML
function generateAdHTML(creative, clickUrl, impressionUrl, adSize) {
  const [width, height] = adSize.split('x').map(Number);
  
  let adContent = '';
  
  if (creative.creativeType === 'banner' && creative.imageUrl) {
    adContent = `
      <a href="${clickUrl}" target="_blank" style="display:block;text-decoration:none;">
        <img src="${creative.imageUrl}" 
             alt="${creative.altText || ''}"
             style="width:${width}px;height:${height}px;border:none;display:block;"
             onload="parent.postMessage({type:'vanta-ad-resize',height:${height}},'*')" />
      </a>
    `;
  } else if (creative.creativeType === 'banner' && creative.htmlContent) {
    adContent = creative.htmlContent;
  } else {
    // Text ad fallback
    adContent = `
      <div style="width:${width}px;height:${height}px;background:#f5f5f5;border:1px solid #ddd;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;font-size:14px;">
        <a href="${clickUrl}" target="_blank" style="color:#333;text-decoration:none;">
          ${creative.creativeName}
        </a>
      </div>
    `;
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { margin: 0; padding: 0; }
        * { box-sizing: border-box; }
      </style>
    </head>
    <body>
      ${adContent}
      <img src="${impressionUrl}" width="1" height="1" style="position:absolute;left:-9999px;" />
      <script>
        parent.postMessage({type:'vanta-ad-resize',height:${height}},'*');
      </script>
    </body>
    </html>
  `;
}

export default router;