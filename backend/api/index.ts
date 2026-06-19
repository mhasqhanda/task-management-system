import { bootstrap, expressApp } from '../src/lambda';

// This is the Vercel serverless function handler.
// Every incoming request to the backend is routed here by vercel.json.
export default async function handler(req: any, res: any) {
  await bootstrap();
  expressApp(req, res);
}
