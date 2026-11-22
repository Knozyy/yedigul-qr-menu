import { Router } from 'express';
import { readPublicMenu } from './routes/menu.js';

// Salt-okunur MCP sunucusu (Streamable HTTP, durumsuz, yalnız JSON yanıt).
// Yalnız herkese açık menü verisini okur; yazma veya yönetim aracı YOKTUR.
// Araçlar sitedeki WebMCP araçlarıyla (www/js/site.js) aynı sözleşmededir.

export const MCP_SERVER_INFO = { name: 'yedigul-restaurant', title: 'Yedigül Restaurant', version: '1.0.0' };
const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const SITE = 'https://www.yedigulrestorant.com';

export const RESTAURANT_INFO = {
  name: 'Yedigül Restaurant',
  type: 'Seafood restaurant',
  address: 'Anadolu Kavağı Mahallesi, Macar Tabya Cd. 6/A, 34825 Beykoz / İstanbul, Türkiye',
  geo: { latitude: 41.17343, longitude: 29.08846 },
  opening_hours: 'Every day 11:00-00:00 (Europe/Istanbul)',
  phone: '+905369379280',
  reservations: 'https://wa.me/905369379280',
  email: 'info@yedigulrestorant.com',
  currency: 'TRY',
  menu_languages: ['tr', 'en', 'ar', 'ru'],
  links: {
    prices: `${SITE}/fiyatlar/`,
    prices_markdown: `${SITE}/fiyatlar.md`,
    menu: `${SITE}/menu/`,
    contact: `${SITE}/iletisim/`,
    llms: `${SITE}/llms.txt`,
  },
};

export const MCP_TOOLS = [
  {
    name: 'search_menu',
    title: 'Search menu',
    description:
      "Search Yedigül Restaurant's menu by dish, ingredient or category name (Turkish, English, Arabic or Russian). Returns matching items with price in Turkish lira (null means daily market price), portion and allergens.",
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: "Dish, ingredient or category, e.g. 'levrek', 'sea bass', 'rakı', 'dessert'." },
        max_results: { type: 'integer', minimum: 1, maximum: 50, description: 'Maximum number of items to return (default 10).' },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_restaurant_info',
    title: 'Restaurant info',
    description: "Get Yedigül Restaurant's address, location, opening hours, phone, reservation link and key page links.",
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

const norm = (value) =>
  String(value ?? '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');

export function searchMenu(db, { query, max_results } = {}) {
  const q = norm(query).trim();
  const limit = Math.min(Math.max(Number.parseInt(max_results, 10) || 10, 1), 50);
  const menu = readPublicMenu(db);
  const cats = Object.fromEntries(menu.categories.map((c) => [c.id, c]));
  const items = menu.products
    .filter((p) => {
      const cat = cats[p.cat] || {};
      const hay = [p.name.tr, p.name.en, p.name.ar, p.name.ru, cat.tr, cat.en, ...(p.ing?.tr || []), ...(p.ing?.en || [])];
      return !q || hay.some((v) => norm(v).includes(q));
    })
    .slice(0, limit)
    .map((p) => ({
      name: p.name.tr,
      name_en: p.name.en,
      category: cats[p.cat]?.tr ?? null,
      price_try: typeof p.price === 'number' ? p.price : null,
      variants: (p.variants || []).map((v) => ({ name: v.name.tr, price_try: v.price })),
      portion: p.portion || null,
      allergens: p.alg?.en || [],
    }));
  return { query: query ?? '', count: items.length, items, full_price_list: RESTAURANT_INFO.links.prices_markdown };
}

function callTool(db, name, args) {
  if (name === 'search_menu') {
    if (typeof args?.query !== 'string') throw Object.assign(new Error('query (string) is required'), { toolError: true });
    return searchMenu(db, args);
  }
  if (name === 'get_restaurant_info') return RESTAURANT_INFO;
  throw Object.assign(new Error(`Unknown tool: ${name}`), { rpcCode: -32602 });
}

const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

function handleMessage(db, msg) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return fail(msg?.id, -32600, 'Invalid Request');
  }
  const isNotification = msg.id === undefined || msg.id === null;
  if (isNotification) return null;
  const { id, method, params } = msg;
  switch (method) {
    case 'initialize': {
      const asked = params?.protocolVersion;
      return ok(id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(asked) ? asked : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: MCP_SERVER_INFO,
        instructions:
          'Read-only information about Yedigül Restaurant (Anadolu Kavağı, Istanbul): menu search with prices in Turkish lira, and address/hours/contact. No ordering or booking actions.',
      });
    }
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: MCP_TOOLS });
    case 'tools/call': {
      try {
        const data = callTool(db, params?.name, params?.arguments || {});
        return ok(id, { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data, isError: false });
      } catch (err) {
        if (err.toolError) return ok(id, { content: [{ type: 'text', text: err.message }], isError: true });
        return fail(id, err.rpcCode || -32603, err.message);
      }
    }
    default:
      return fail(id, -32601, `Method not found: ${method}`);
  }
}

export function serverCard() {
  return {
    serverInfo: MCP_SERVER_INFO,
    description:
      'Read-only MCP server for Yedigül Restaurant, a seafood restaurant on the Bosphorus in Anadolu Kavağı, Istanbul: search the menu with prices (TRY) and get address, opening hours and contact details.',
    protocolVersion: SUPPORTED_VERSIONS[0],
    transport: { type: 'streamable-http', endpoint: `${SITE}/mcp` },
    endpoint: `${SITE}/mcp`,
    capabilities: { tools: { listChanged: false } },
    tools: MCP_TOOLS.map(({ name, title, description }) => ({ name, title, description })),
    authentication: { required: false },
    documentationUrl: `${SITE}/llms.txt`,
    websiteUrl: `${SITE}/`,
  };
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version');
}

export function createMcpRouter(db) {
  const router = Router();

  router.get('/.well-known/mcp/server-card.json', (_req, res) => {
    cors(res);
    res.json(serverCard());
  });

  router.options('/mcp', (_req, res) => {
    cors(res);
    res.status(204).end();
  });

  router.get('/mcp', (_req, res) => {
    cors(res);
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json(fail(null, -32000, 'This server does not offer an SSE stream; use POST.'));
  });

  router.post('/mcp', (req, res) => {
    cors(res);
    const body = req.body;
    const batch = Array.isArray(body);
    const messages = batch ? body : [body];
    if (!messages.length || req.headers['content-type']?.split(';')[0] !== 'application/json') {
      return res.status(400).json(fail(null, -32600, 'Invalid Request'));
    }
    const replies = messages.map((m) => handleMessage(db, m)).filter(Boolean);
    if (!replies.length) return res.status(202).end();
    res.json(batch ? replies : replies[0]);
  });

  return router;
}

// Bozuk JSON gövdesi createApp'teki express.json() içinde düşer, yani router'a
// hiç ulaşmaz. Bu hata işleyicisi uygulama düzeyinde bağlanır.
export function mcpParseErrorHandler(err, req, res, next) {
  if (req.path !== '/mcp' || err?.type !== 'entity.parse.failed') return next(err);
  cors(res);
  res.status(400).json(fail(null, -32700, 'Parse error'));
}
