# VPS Banka - Education Management System (EMS)

A comprehensive education management system built with modern web technologies.

## Project Information

**Developed by:** Developer  
**Purpose:** Complete Education Management System  
**Technology Stack:** React, TypeScript, Vite, Tailwind CSS, shadcn-ui

## Technologies Used

- **Vite** - Fast build tool and development server
- **React 18** - UI component library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn-ui** - High-quality React components
- **React Router** - Client-side routing
- **React Hook Form** - Efficient form management
- **Supabase** - Backend as a service
- **MongoDB** - NoSQL database

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or bun package manager

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd vpsbanka

# Step 3: Install dependencies
npm install
# or using bun
bun install
```

### Configuration

Create a `.env.local` file in the project root with your MongoDB connection:

```
VITE_MONGODB_URI=mongodb+srv://alok85820018_db_user:Z05WSo1bGLeEIdjI@cluster0.z0g5y75.mongodb.net/?appName=Cluster0
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Development

```sh
# Start the development server with hot reload
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

```sh
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Testing

```sh
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

### Linting

```sh
# Check code quality
npm run lint
```

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── ui/             # shadcn-ui components
│   └── App components
├── pages/              # Page components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── integrations/       # Third-party integrations
└── App.tsx             # Root component
```

## Features

- User authentication and authorization
- Dashboard with analytics
- Class management
- Live class support
- Exam management
- User management
- School management
- Calendar integration
- Settings management
- PDF viewing capabilities

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Support

For issues or questions, please contact the development team.

---

**Note:** This is a fully developed education management system. All Lovable branding and watermarks have been removed.
