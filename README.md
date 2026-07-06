# Supplier Database Web App

A Next.js 16 web application for managing supplier databases, converted from a Flutter mobile app. Built with Supabase for backend and authentication.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Styling**: TailwindCSS
- **Forms**: React Hook Form + Zod
- **CSV Parsing**: PapaParse

## Features

- Authentication (Sign in / Sign up)
- Supplier management (CRUD operations)
- Categories management
- Contact persons management (one-to-many with suppliers)
- Search and filtering (by category, entity type, region, tender relevance, verification status)
- Pagination (30 items per page)
- CSV import with column mapping

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

Create a file named `env.config.ts` in the project root (or use environment variables):

```typescript
export const env = {
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

Or set environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the Supabase migrations from the Flutter project:

- `20260617120000_initial_schema.sql`
- `20260617130000_contacts_restructure.sql`

These create the `categories`, `suppliers`, and `contacts` tables with proper indexes and RLS policies.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Architecture

The project follows clean architecture with feature-based organization:

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/login/      # Login page
│   ├── suppliers/         # Supplier list, detail, edit, new
│   ├── categories/        # Categories management
│   └── import/            # CSV import
├── core/
│   ├── config/            # Environment configuration
│   ├── providers/         # React providers (AuthProvider)
│   ├── supabase/          # Supabase client
│   └── utils/             # Utility functions
└── features/
    ├── auth/
    │   ├── domain/        # Types
    │   ├── data/          # Repository
    │   ├── application/   # Zustand store
    │   └── presentation/  # Components
    ├── suppliers/
    ├── categories/
    ├── contacts/
    └── import/
```

## Database Schema

### Categories
- `id` (uuid, primary key)
- `name` (text, unique)
- `created_at` (timestamptz)

### Suppliers
- `id` (uuid, primary key)
- `business_name` (text)
- `category_id` (uuid, foreign key)
- `entity_type` (text)
- `products_services` (text)
- `region` (text)
- `address` (text)
- `phone` (text)
- `email` (text)
- `tin_number` (text)
- `tender_relevant` (boolean)
- `source_directory` (text)
- `verification_status` (text: unverified/verified/blacklisted)
- `notes` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Contacts
- `id` (uuid, primary key)
- `supplier_id` (uuid, foreign key)
- `name` (text)
- `position` (text)
- `phone` (text)
- `email` (text)
- `created_at` (timestamptz)

## Build for Production

```bash
npm run build
npm start
```

## Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to set the Supabase environment variables in your Vercel project settings.
