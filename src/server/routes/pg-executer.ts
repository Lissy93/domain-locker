import { createError, defineEventHandler, readBody, sendError } from 'h3';
import pkg from 'pg';
const { Client } = pkg;

function handleCors(event: any) {
  const req = event.node.req;
  const res = event.node.res;
  const origin = req.headers['origin'] || '*';

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  return false;
}

async function getPostgresClient(credentials: any) {
  const host = credentials?.host || process.env['DL_PG_HOST'];
  const port = +(credentials?.port || process.env['DL_PG_PORT'] || '5432');
  const user = credentials?.user || process.env['DL_PG_USER'];
  const password = credentials?.password || process.env['DL_PG_PASSWORD'];
  const database = credentials?.database || process.env['DL_PG_NAME'];

  if (!host || !user || !password || !database) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Postgres credentials',
    });
  }

  const client = new Client({ host, port, user, password, database });
  try {
    await client.connect();
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to connect to Postgres',
      data: { error: err.message },
    });
  }

  return client;
}

export default defineEventHandler(async (event) => {
  if (handleCors(event)) return;

  try {
    const body = await readBody(event);
    if (!body?.query) {
      return sendError(event, createError({ statusCode: 400, statusMessage: 'Missing query in request body' }));
    }

    const { query, params, credentials } = body;

    const client = await getPostgresClient(credentials);

    try {
      const result = await client.query(query, params || []);
      return { data: result.rows };
    } catch (queryErr: any) {
      console.error('❌ Query execution error:', queryErr);
      return sendError(event, createError({
        statusCode: 500,
        statusMessage: 'Error executing query',
        data: { error: queryErr.message }
      }));
    } finally {
      await client.end();
    }
  } catch (err: any) {
    console.error('❌ Unexpected error in Postgres executer:', err);
    return sendError(event, createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Unexpected server error',
      data: { error: err.data?.error || err.message }
    }));
  }
});
