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

const router = express.Router();

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
        placement: vantatrackPlacements,
        site: vantatrackSites,
        publisher: vantatrackPublishers
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
        // Budget check
        sql`(${vantatrackLineItems.dailyBudgetBdt} IS NULL OR ${vantatrackLineItems.spentBdt} < ${vantatrackLineItems.dailyBudgetBdt})`,
        sql`(${vantatrackLineItems.totalBudgetBdt} IS NULL OR ${vantatrackLineItems.spentBdt} < ${vantatrackLineItems.totalBudgetBdt})`
      ))
      .orderBy(desc(vantatrackLineItems.bidCpmBdt), desc(vantatrackLineItems.weight));

    if (!eligibleLineItems.length) {
      return res.send('<div style="display:none;"><!-- No eligible ads --></div>');
    }

    // Simple weighted selection (take highest bidder for now)
    const selectedItem = eligibleLineItems[0];
    const { lineItem, creative, campaign, client } = selectedItem;

    // Generate impression tracking
    const impressionUrl = `/ad/v1/i?li=${lineItem.id}&c=${creative.id}&p=${placementInfo.id}`;
    const clickUrl = `/ad/v1/c?li=${lineItem.id}&c=${creative.id}&p=${placementInfo.id}&u=${encodeURIComponent(creative.clickUrl)}`;

    // Detect device type
    const userAgent = ua || req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';

    // Log impression asynchronously
    setImmediate(() => {
      logAdEvent('impression', {
        placementId: placementInfo.id,
        creativeId: creative.id,
        lineItemId: lineItem.id,
        campaignId: campaign.id,
        clientId: client.id,
        siteId: site.id,
        publisherId: publisher.id,
        userIp: req.ip,
        userAgent: userAgent,
        referrer: ref || req.headers.referer || '',
        deviceType,
        revenueBdt: parseFloat(lineItem.bidCpmBdt) / 1000 // CPM to per-impression
      });
    });

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

// Impression tracking endpoint
router.all('/v1/i', async (req, res) => {
  const { li: lineItemId, c: creativeId, p: placementId } = req.query;
  
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (lineItemId && creativeId && placementId) {
    // Log impression - this is handled by the serve endpoint
    // This endpoint exists for additional tracking pixels if needed
  }
  
  // Return 1x1 transparent GIF
  const gif = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x04, 0x01, 0x00, 0x3B
  ]);
  
  res.send(gif);
});

// Click tracking endpoint
router.get('/v1/c', async (req, res) => {
  const { li: lineItemId, c: creativeId, p: placementId, u: destination } = req.query;
  
  if (lineItemId && creativeId && placementId) {
    try {
      // Get placement info for logging
      const placementData = await db
        .select({
          placement: vantatrackPlacements,
          site: vantatrackSites,
          publisher: vantatrackPublishers
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
            lineItem: vantatrackLineItems,
            campaign: vantatrackCampaigns
          })
          .from(vantatrackLineItems)
          .leftJoin(vantatrackCampaigns, eq(vantatrackLineItems.campaignId, vantatrackCampaigns.id))
          .where(eq(vantatrackLineItems.id, parseInt(lineItemId)))
          .limit(1);

        if (lineItemData.length) {
          const { lineItem, campaign } = lineItemData[0];
          
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
        }
      }
    } catch (error) {
      console.error('Click tracking error:', error);
    }
  }
  
  // Redirect to destination
  if (destination) {
    res.redirect(decodeURIComponent(destination));
  } else {
    res.status(400).send('Invalid click tracking request');
  }
});

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