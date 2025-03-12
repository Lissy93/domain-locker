import { createError, defineEventHandler, readBody, sendError } from 'h3';
import pkg from 'pg';
const { Client } = pkg;

export default defineEventHandler(async (event) => {
  // 1) Set CORS headers
  const res = event.node.res; // raw Node response
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // If it's a preflight (OPTIONS) request, return early
  if (event.node.req.method === 'OPTIONS') {
    res.statusCode = 204;
    return '';
  }

  // 2) The normal logic continues if it's not an OPTIONS request
  try {
    // read request body
    const body = await readBody(event);
    if (!body?.query) {
      return sendError(
        event,
        createError({ statusCode: 400, statusMessage: 'Missing query in request body' })
      );
    }

    const { query, params, credentials } = body;
    // creds may be undefined
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

    const client = new Client({
      host,
      port: parseInt(port, 10),
      user,
      password,
      database,
    });

    await client.connect().catch((connErr) => {
      throw createError({
        statusCode: 500,
        statusMessage: 'Unable to connect to Postgres',
        data: { error: connErr.message },
      });
    });

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
