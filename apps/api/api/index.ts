// Vercel serverless entry for the NestJS API.
// Imports the COMPILED app (dist) — built by `nest build` in the Vercel buildCommand —
// so esbuild only bundles plain JS (no decorator-metadata issues).
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createApp } from '../dist/serverless';

let appPromise;

export default async function handler(req, res) {
  if (!appPromise) appPromise = createApp();
  const app = await appPromise;
  return app(req, res);
}
