import { createServer } from './server.js';

async function main() {
  const server = await createServer();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`[PantryOS API] Server listening on http://0.0.0.0:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
