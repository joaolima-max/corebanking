// Root-level Vercel serverless entry for the NestJS API.
// Used when the Vercel project's Root Directory is the repo root.
// Imports the COMPILED app (built by the buildCommand) so esbuild only bundles JS.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createApp } from '../apps/api/dist/serverless';

let appPromise;

export default async function handler(req, res) {
  if (!appPromise) appPromise = createApp();
  const app = await appPromise;
  return app(req, res);
}
