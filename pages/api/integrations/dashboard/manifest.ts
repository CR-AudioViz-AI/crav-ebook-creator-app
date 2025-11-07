import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { getErrorMessage, logError, formatApiError } from '@/lib/utils/error-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const manifestPath = path.join(process.cwd(), 'public', '.well-known', 'crav-plugin.json');
    const manifestData = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestData);

    res.setHeader('Content-Type', 'application/json');
    res.json(manifest);
  } catch (error: unknown) {
    res.status(500).json({
      fallback: true,
      path: '/.well-known/crav-plugin.json',
      error: 'Could not read manifest file',
    });
  }
}
