export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  // Extract the path after /api/hiro/
  const hiroPath = url.pathname.replace(/^\/api\/hiro\//, '');
  const targetUrl = `https://api.testnet.hiro.so/${hiroPath}${url.search}`;

  const headers = new Headers();
  headers.set('Content-Type', request.headers.get('Content-Type') || 'application/json');

  const init = {
    method: request.method,
    headers,
  };

  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    init.body = await request.text();
  }

  try {
    const response = await fetch(targetUrl, init);
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error', message: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
