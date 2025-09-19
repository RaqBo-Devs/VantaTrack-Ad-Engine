# VantaTrack Technical Requirements

## Multi-Tenant Architecture
- Client permissions: portal_access, google_access, facebook_access (booleans)
- Dynamic UI based on client package type
- Role-based access control (Agency Admin, Client User, Client Admin)
- Data isolation ensuring clients only see authorized information

## Media Buying Integration
- Google Ads API v13+ OR manual CSV upload
- Facebook Marketing API v18+ OR manual CSV upload
- Unified reporting across all platforms
- Data source indicators (API vs Manual)
- Template downloads for CSV imports

## Portal Ad Engine
- Sub-100ms ad serving for Bangladesh portals
- Mobile-first design (70% mobile traffic)
- 3G optimization for slow connections
- Bengali language support

## UI/UX Standards
- Premium design with VantaTrack branding
- Interactive charts and real-time data
- Drag-and-drop file uploads
- Responsive design for all screen sizes

## Database Schema
- vantatrack_clients (with platform permissions)
- vantatrack_users, vantatrack_campaigns
- vantatrack_google_campaigns, vantatrack_facebook_campaigns
- vantatrack_portals, vantatrack_analytics