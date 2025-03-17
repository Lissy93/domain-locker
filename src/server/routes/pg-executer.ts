import { createError, defineEventHandler, readBody, sendError } from 'h3';
import pkg from 'pg';
const { Client } = pkg;

export default defineEventHandler(async (event) => {
  const req = event.node.req;
  const res = event.node.res;

  // Get origin from header, or fallback to localhost
  const requestOrigin = req.headers['origin'] || 'http://localhost:3000';

  // Provide a flexible whitelist, or allow all (for dev)
  res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  res.setHeader('Vary', 'Origin');

  // Additional CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 4) For OPTIONS preflight request => short-circuit
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return '';
  }

  try {
    const body = await readBody(event);
    if (!body?.query) {
      return sendError(
        event,
        createError({ statusCode: 400, statusMessage: 'Missing query in request body' })
      );
    }

    // Deconstruct from body
    const { query, params, credentials } = body;

    // Consolidate credentials from either body or env
    const host = credentials?.host || process.env['DL_PG_HOST'];
    const port = credentials?.port || process.env['DL_PG_PORT'] || '5432';
    const user = credentials?.user || process.env['DL_PG_USER'];
    const password = credentials?.password || process.env['DL_PG_PASSWORD'];
    const database = credentials?.database || process.env['DL_PG_NAME'];

    if (!host || !user || !password || !database) {
      return sendError(
        event,
        createError({
          statusCode: 400,
          statusMessage: 'Missing Postgres credentials',
        })
      );
    }

    // Connect to Postgres
    const client = new Client({ host, port: +port, user, password, database });
    await client.connect().catch((connErr) => {
      throw createError({
        statusCode: 500,
        statusMessage: 'Unable to connect to Postgres',
        data: { error: connErr.message },
      });
    });

    // Attempt the query
    try {
      const result = await client.query(query, params || []);
      return { data: result.rows };
    } catch (queryError: any) {
      console.error('Query execution error:', queryError);
      return sendError(
        event,
        createError({
          statusCode: 500,
          statusMessage: 'Error executing query',
          data: { error: queryError.message },
        })
      );
    } finally {
      await client.end();
    }
  } catch (error: any) {
    console.error('Postgres executer faced an unexpected error:', error);
    return sendError(
      event,
      createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || 'Unexpected server error',
        data: { error: error.data?.error || error.message },
      })
    );
  }
});
