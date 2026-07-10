/**
 * HTTP (Streamable) MCP server exposing the supplier catalog (products + contacts).
 *
 * It speaks the Model Context Protocol over the Streamable HTTP transport, so
 * any MCP-compatible client (Claude Desktop, IDEs, custom agents) can list,
 * search and manage suppliers' products and contacts stored in Supabase.
 *
 * Run it with:  npm run mcp
 *
 * Environment (read from .env.local or the process environment):
 *   SUPABASE_URL                 (falls back to NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY    (falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *   MCP_PORT                     (default: 3100)
 *
 * IMPORTANT: this server has no logged-in user, so it must use the Supabase
 * SERVICE-ROLE key to bypass Row Level Security. With only the anon key, every
 * read returns 0 rows and every write is rejected with an RLS error (42501).
 */
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

// Load .env.local first (Next.js convention), then .env as a fallback.
loadEnv({ path: '.env.local' });
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_KEY = SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const usingServiceRole = Boolean(SERVICE_ROLE_KEY);
const PORT = Number(process.env.MCP_PORT || 3100);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY ' +
      '(or NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SUPPLIERS = 'suppliers';
const PRODUCTS = 'products';
const CONTACTS = 'contacts';

const RLS_HELP =
  ' [The MCP server is running with the Supabase ANON key, which Row Level ' +
  'Security blocks for a server with no logged-in user. Add SUPABASE_SERVICE_ROLE_KEY ' +
  'to .env.local (Supabase Dashboard > Project Settings > API > service_role) and ' +
  'restart the server with `npm run mcp` to enable reading and writing.]';

interface DbError {
  code?: string;
  message: string;
}

function json(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    // structuredContent must be an object, so wrap arrays/scalars under `data`.
    structuredContent: { data } as Record<string, unknown>,
  };
}

function fail(message: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}

/** Turn a Supabase/Postgrest error into a helpful, actionable tool error. */
function failFromError(error: DbError) {
  const isRls = error.code === '42501' || /row-level security/i.test(error.message);
  if (isRls && !usingServiceRole) {
    return fail(`${error.message}.${RLS_HELP}`);
  }
  if (isRls && usingServiceRole) {
    return fail(
      `${error.message}. (RLS denied the operation even with the service-role key — verify your policies.)`
    );
  }
  return fail(error.message);
}

/** Build a fresh MCP server instance with all tools registered. */
function buildServer(): McpServer {
  const server = new McpServer({
    name: 'supplier-catalog-mcp',
    version: '1.1.0',
  });

  // ---------------------------------------------------------------- suppliers
  server.registerTool(
    'list_suppliers',
    {
      title: 'List suppliers',
      description:
        'List suppliers (id, business_name, region) to help find a supplier_id for the product/contact tools. Optional case-insensitive search by name.',
      inputSchema: {
        search: z.string().optional().describe('Filter suppliers whose business name contains this text'),
        limit: z.number().int().positive().max(200).optional().describe('Max rows (default 50)'),
      },
    },
    async ({ search, limit }) => {
      let query = supabase.from(SUPPLIERS).select('id, business_name, region').order('business_name');
      if (search && search.trim()) query = query.ilike('business_name', `%${search.trim()}%`);
      const { data, error } = await query.limit(limit ?? 50);
      if (error) return failFromError(error);
      return json(data);
    }
  );

  // ----------------------------------------------------------------- products
  server.registerTool(
    'list_products',
    {
      title: 'List products',
      description:
        'List products across all suppliers, or for a specific supplier when supplier_id is provided. Supports case-insensitive text search over name and description.',
      inputSchema: {
        supplier_id: z.string().uuid().optional().describe('Restrict to a single supplier'),
        search: z.string().optional().describe('Filter by text in name or description'),
        limit: z.number().int().positive().max(500).optional().describe('Max rows (default 100)'),
      },
    },
    async ({ supplier_id, search, limit }) => {
      let query = supabase.from(PRODUCTS).select('*').order('created_at');
      if (supplier_id) query = query.eq('supplier_id', supplier_id);
      if (search && search.trim()) {
        const pattern = `%${search.trim()}%`;
        query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
      }
      const { data, error } = await query.limit(limit ?? 100);
      if (error) return failFromError(error);
      return json(data);
    }
  );

  server.registerTool(
    'get_product',
    {
      title: 'Get product',
      description: 'Fetch a single product by its id.',
      inputSchema: { id: z.string().uuid().describe('Product id') },
    },
    async ({ id }) => {
      const { data, error } = await supabase.from(PRODUCTS).select('*').eq('id', id).single();
      if (error) return failFromError(error);
      return json(data);
    }
  );

  server.registerTool(
    'create_product',
    {
      title: 'Create product',
      description: 'Create a new product for a supplier.',
      inputSchema: {
        supplier_id: z.string().uuid().describe('Owning supplier id'),
        name: z.string().min(1).describe('Product name'),
        description: z.string().optional().describe('Optional description'),
        price: z.number().optional().describe('Optional unit price'),
        unit: z.string().optional().describe('Optional unit, e.g. kg, item, box'),
      },
    },
    async ({ supplier_id, name, description, price, unit }) => {
      const { data, error } = await supabase
        .from(PRODUCTS)
        .insert({ supplier_id, name, description, price: price ?? null, unit })
        .select()
        .single();
      if (error) return failFromError(error);
      return json(data);
    }
  );

  server.registerTool(
    'update_product',
    {
      title: 'Update product',
      description: 'Update fields of an existing product. Only provided fields are changed.',
      inputSchema: {
        id: z.string().uuid().describe('Product id'),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        price: z.number().nullable().optional(),
        unit: z.string().nullable().optional(),
      },
    },
    async ({ id, ...rest }) => {
      const patch = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      if (Object.keys(patch).length === 0) return fail('No fields provided to update.');
      const { data, error } = await supabase.from(PRODUCTS).update(patch).eq('id', id).select().single();
      if (error) return failFromError(error);
      return json(data);
    }
  );

  server.registerTool(
    'delete_product',
    {
      title: 'Delete product',
      description: 'Delete a product by its id.',
      inputSchema: { id: z.string().uuid().describe('Product id') },
    },
    async ({ id }) => {
      const { error } = await supabase.from(PRODUCTS).delete().eq('id', id);
      if (error) return failFromError(error);
      return json({ deleted: true, id });
    }
  );

  // ----------------------------------------------------------------- contacts
  server.registerTool(
    'list_contacts',
    {
      title: 'List contacts',
      description:
        'List contact persons, optionally restricted to one supplier via supplier_id, with optional text search over name/position.',
      inputSchema: {
        supplier_id: z.string().uuid().optional().describe('Restrict to a single supplier'),
        search: z.string().optional().describe('Filter by text in name or position'),
        limit: z.number().int().positive().max(500).optional().describe('Max rows (default 100)'),
      },
    },
    async ({ supplier_id, search, limit }) => {
      let query = supabase.from(CONTACTS).select('*').order('created_at');
      if (supplier_id) query = query.eq('supplier_id', supplier_id);
      if (search && search.trim()) {
        const pattern = `%${search.trim()}%`;
        query = query.or(`name.ilike.${pattern},position.ilike.${pattern}`);
      }
      const { data, error } = await query.limit(limit ?? 100);
      if (error) return failFromError(error);
      return json(data);
    }
  );

  server.registerTool(
    'create_contact',
    {
      title: 'Create contact',
      description: 'Add a contact person to a supplier.',
      inputSchema: {
        supplier_id: z.string().uuid().describe('Owning supplier id'),
        name: z.string().min(1).describe('Contact name'),
        position: z.string().optional().describe('Optional position / role'),
        phone: z.string().optional().describe('Optional phone number(s)'),
        email: z.string().optional().describe('Optional email'),
      },
    },
    async ({ supplier_id, name, position, phone, email }) => {
      const { data, error } = await supabase
        .from(CONTACTS)
        .insert({ supplier_id, name, position, phone, email })
        .select()
        .single();
      if (error) return failFromError(error);
      return json(data);
    }
  );

  server.registerTool(
    'update_contact',
    {
      title: 'Update contact',
      description: 'Update fields of an existing contact. Only provided fields are changed.',
      inputSchema: {
        id: z.string().uuid().describe('Contact id'),
        name: z.string().min(1).optional(),
        position: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
      },
    },
    async ({ id, ...rest }) => {
      const patch = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      if (Object.keys(patch).length === 0) return fail('No fields provided to update.');
      const { data, error } = await supabase.from(CONTACTS).update(patch).eq('id', id).select().single();
      if (error) return failFromError(error);
      return json(data);
    }
  );

  server.registerTool(
    'delete_contact',
    {
      title: 'Delete contact',
      description: 'Delete a contact by its id.',
      inputSchema: { id: z.string().uuid().describe('Contact id') },
    },
    async ({ id }) => {
      const { error } = await supabase.from(CONTACTS).delete().eq('id', id);
      if (error) return failFromError(error);
      return json({ deleted: true, id });
    }
  );

  return server;
}

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: '*',
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'mcp-session-id', 'mcp-protocol-version'],
  })
);

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    server: 'supplier-catalog-mcp',
    credentials: usingServiceRole ? 'service_role' : 'anon',
    rlsWritable: usingServiceRole,
  });
});

// Stateless Streamable HTTP: a fresh server + transport per request.
app.post('/mcp', async (req: Request, res: Response) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
  });

  res.on('close', () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('MCP request error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

// Session-based methods are not supported in stateless mode.
const methodNotAllowed = (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed. This server is stateless; use POST /mcp.' },
    id: null,
  });
};
app.get('/mcp', methodNotAllowed);
app.delete('/mcp', methodNotAllowed);

app.listen(PORT, () => {
  console.log(`Supplier Catalog MCP server (Streamable HTTP) listening on http://localhost:${PORT}/mcp`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  if (usingServiceRole) {
    console.log('Credentials: service_role key (RLS bypassed — full read/write).');
  } else {
    console.warn(
      '\n' +
        '============================================================\n' +
        ' WARNING: running with the ANON key.\n' +
        ' Row Level Security will hide all rows and REJECT all writes\n' +
        ' (error 42501). Products/contacts created via this server will\n' +
        ' NOT be saved.\n' +
        '\n' +
        ' Fix: add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart.\n' +
        ' (Supabase Dashboard > Project Settings > API > service_role)\n' +
        '============================================================\n'
    );
  }
});
