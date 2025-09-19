# VantaTrack Ad Engine

## Overview

VantaTrack Ad Engine is a comprehensive media management platform designed specifically for Bangladesh digital advertising agencies. The system provides a unified dashboard for managing advertising campaigns across multiple platforms including Google Ads, Facebook Ads, and Bangladesh news portals (Daily Star, Dhaka Tribune, etc.). The platform features multi-tenant architecture with role-based access control, supporting agencies, clients, and portal owners with flexible permission systems based on purchased packages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19+ with Vite for fast development and hot module replacement
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **Styling**: Tailwind CSS with custom VantaTrack branding (deep blue #1e40af primary, emerald #059669 accent)
- **UI Components**: Custom component library with premium design patterns
- **Typography**: Inter and Poppins font families for professional appearance

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Multi-layered approach using Passport.js with local and JWT strategies
- **Session Management**: Express sessions with PostgreSQL store for persistence
- **Security**: Helmet for security headers, CORS for cross-origin requests, rate limiting for API protection
- **File Processing**: Multer for CSV/Excel uploads with validation and parsing

### Data Storage Solutions
- **Primary Database**: PostgreSQL with connection pooling
- **Schema Design**: Drizzle-managed schema with `vantatrack_` prefixed tables
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **File Upload**: In-memory processing for CSV/Excel files with validation

### Authentication and Authorization
- **Multi-Strategy Authentication**: Local username/password and JWT bearer tokens
- **Role-Based Access Control**: Four user roles (agency_admin, client_user, client_admin, portal_owner)
- **Platform Permissions**: Boolean flags for portal_access, google_access, facebook_access
- **Middleware Protection**: Route-level authorization with client access verification
- **Password Security**: Scrypt hashing with salt for secure password storage

### API Integration Architecture
- **Dual-Mode Design**: API integration with manual upload fallback for immediate deployment
- **Google Ads Integration**: Prepared for v13+ API with OAuth2 authentication
- **Facebook Marketing Integration**: Prepared for v18+ API with access token authentication
- **Manual Upload System**: CSV/Excel processing with template downloads and validation
- **Data Source Tracking**: Clear indicators for API vs manual data sources

## External Dependencies

### Core Runtime Dependencies
- **express**: Web application framework for Node.js
- **pg**: PostgreSQL client for database connectivity
- **drizzle-orm**: Type-safe ORM for database operations
- **bcryptjs**: Password hashing for user authentication
- **jsonwebtoken**: JWT token generation and verification
- **passport**: Authentication middleware with local and JWT strategies

### Frontend Dependencies
- **react**: UI library for component-based architecture
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing for single-page application
- **tailwindcss**: Utility-first CSS framework with custom VantaTrack theme
- **lucide-react**: Icon library for consistent UI elements

### File Processing and Security
- **multer**: Middleware for handling multipart/form-data file uploads
- **csv-parser**: CSV file parsing for campaign data imports
- **xlsx**: Excel file processing for campaign data
- **helmet**: Security middleware for HTTP headers
- **cors**: Cross-origin resource sharing configuration
- **express-rate-limit**: API rate limiting for security

### Development and Database Tools
- **drizzle-kit**: Database migrations and schema management
- **nodemon**: Development server with auto-restart
- **concurrently**: Concurrent development server execution
- **connect-pg-simple**: PostgreSQL session store adapter

### Planned External APIs
- **Google Ads API v13+**: For automated Google Ads campaign data synchronization
- **Facebook Marketing API v18+**: For Meta platform advertising data integration
- **Bangladesh News Portals**: Custom integrations with local digital newspapers

### Environment Configuration
- **dotenv**: Environment variable management for configuration
- **PostgreSQL Database**: Required DATABASE_URL for production deployment
- **JWT and Session Secrets**: Required for authentication security
- **Optional API Keys**: Google Ads and Facebook Marketing API credentials for automation