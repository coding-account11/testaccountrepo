# Overview

BookingAI is a minimalist, AI-driven email marketing platform designed for service businesses like salons and clinics. The platform focuses on creating personalized email campaigns and tracking one key metric: appointment bookings. Built with a React frontend and Express backend, the application integrates with Square OAuth for client data sync and uses AI to generate compelling campaign content.

## Recent Changes (January 2025)
- **Authentication System**: Added landing page, login/signup, and pricing pages with $99/month and $29/month yearly pricing
- **Square OAuth Integration**: Replaced API key requirements with secure OAuth login for automatic client data sync
- **Enhanced Client Segmentation**: Expanded from 2 to 6 client categories (New, Inactive 30/60 days, Loyal, High-spend, At-risk)
- **File Upload System**: Implemented actual CSV file upload with multer instead of text input
- **Email Integration**: Streamlined email delivery through built-in system without requiring user API keys
- **Activity Tracking**: Removed dummy data, now shows real user activity only
- **UI/UX Improvements**: Maintained clean, minimalist design with maximum 3-4 elements per page

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Client-side routing with Wouter for a lightweight SPA experience
- **UI Components**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS
- **State Management**: TanStack Query (React Query) for server state management and data fetching
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting both light and dark modes

## Backend Architecture
- **Framework**: Express.js with TypeScript for RESTful API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Express session middleware with PostgreSQL session store
- **Development**: Hot module replacement with Vite integration for seamless development experience

## Database Design
- **Users**: Business owner accounts with authentication
- **Clients**: Customer contact information with Square integration support
- **Campaigns**: Email campaign metadata, content, and performance tracking
- **Appointments**: Booking records linked to campaigns for conversion tracking
- **Integrations**: Third-party service configurations (Square, SendGrid)
- **Campaign Recipients**: Junction table for tracking email delivery

## API Structure
- **RESTful endpoints** organized by resource (clients, campaigns, appointments, integrations)
- **User-scoped data** with consistent userId parameter filtering
- **Error handling** with structured JSON responses and HTTP status codes
- **Request validation** using Zod schemas for type safety

## AI Integration
- **Content Generation**: Google Gemini AI for creating personalized email subjects and body content
- **Template System**: Configurable campaign types (promotional, reminder, follow-up) with audience targeting
- **Personalization**: Dynamic content replacement with client data placeholders

# External Dependencies

## Core Services
- **Database**: Neon PostgreSQL serverless database for scalable data storage
- **Email Delivery**: SendGrid API for reliable email campaign delivery with tracking
- **AI Content**: Google Gemini API for intelligent email content generation
- **Booking Integration**: Square API for appointment data synchronization

## Development Tools
- **Build System**: Vite for fast development builds and hot module replacement
- **Database Management**: Drizzle Kit for schema migrations and database operations
- **Type Safety**: TypeScript with strict mode for compile-time error detection
- **Package Management**: npm with lockfile for reproducible builds

## UI Libraries
- **Component System**: Radix UI headless components for accessibility compliance
- **Styling**: Tailwind CSS utility framework with custom design tokens
- **Icons**: Lucide React for consistent iconography
- **Forms**: React Hook Form with Zod resolver for validated form handling

## Monitoring and Error Handling
- **Runtime Errors**: Replit error overlay for development debugging
- **Toast Notifications**: Radix UI toast system for user feedback
- **Query Management**: TanStack Query for caching, background updates, and error boundaries