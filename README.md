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
- Product catalog per supplier (name, description, price, unit), shown side by side with contacts on the supplier page
- Search and filtering (by category, entity type, region, tender relevance, verification status)
- Pagination (30 items per page)
- CSV import with column mapping
- **MCP server** exposing the product catalog over Streamable HTTP for AI tools (read + write)

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

Then apply the products migration in this repo (Supabase SQL editor or `supabase db push`):

- `supabase/migrations/20260710120000_products.sql`

This creates the `products` table (with indexes, an `updated_at` trigger, and RLS policies for authenticated users).

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
    ├── products/
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

### Products
- `id` (uuid, primary key)
- `supplier_id` (uuid, foreign key -> suppliers, on delete cascade)
- `name` (text)
- `description` (text)
- `price` (numeric)
- `unit` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## MCP Server (Product Catalog)

An HTTP (Streamable) [Model Context Protocol](https://modelcontextprotocol.io) server
exposes the supplier catalog so AI tools can list, search, create, update, and delete
both **products** and **contacts**.

### Run it

```bash
npm run mcp
```

The server listens on `http://localhost:3100/mcp` (health check at `/health`).
Configure it via environment variables (read from `.env.local` or the process):

```bash
SUPABASE_URL=your_supabase_url                 # falls back to NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY
MCP_PORT=3100                                    # optional, default 3100
```

> **Important:** Use the Supabase **service-role key** so the server can read and write
> while bypassing RLS. With only the anon key, RLS restricts access to authenticated
> sessions and the server will see no rows and cannot write.

### Connect a client

Point any Streamable-HTTP MCP client at `http://localhost:3100/mcp`. Example client config:

```json
{
  "mcpServers": {
    "supplier-products": {
      "url": "http://localhost:3100/mcp"
    }
  }
}
```

### Tools

Products:
- `list_products` — list products (optional `supplier_id` filter and text search)
- `get_product` — fetch one product by id
- `create_product` — add a product to a supplier
- `update_product` — update a product (only provided fields change)
- `delete_product` — delete a product by id

Contacts:
- `list_contacts` — list contacts (optional `supplier_id` filter and text search)
- `create_contact` — add a contact person to a supplier
- `update_contact` — update a contact (only provided fields change)
- `delete_contact` — delete a contact by id

Suppliers:
- `list_suppliers` — find supplier ids (optional name search)

### Troubleshooting: products/contacts created via MCP don't appear

This almost always means the server is running with the **anon key**. This project's
tables have Row Level Security enabled, so the anon role sees **no rows** and every
write is rejected with error `42501` (`new row violates row-level security policy`).
The record is never saved.

Fix:
1. Add `SUPABASE_SERVICE_ROLE_KEY=<your service_role secret>` to `.env.local`.
2. Restart the server: `npm run mcp`.
3. Confirm `http://localhost:3100/health` shows `"credentials":"service_role"` and `"rlsWritable":true`.

Note: an MCP client must also be able to reach the server. Local clients (e.g. Claude
Desktop) reach `http://localhost:3100/mcp` directly; a cloud client needs a public
tunnel (e.g. ngrok/cloudflared) pointed at that URL.

## Build for Production

```bash
npm run build
npm start
```

## Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to set the Supabase environment variables in your Vercel project settings.
