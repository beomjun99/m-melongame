import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const serverRoot = path.resolve(path.dirname(currentFile), '..', '..');

export const uploadConfig = {
  uploadRoot: path.join(serverRoot, 'uploads'),
  publicPath: '/uploads',
  maxImageSizeBytes: 2 * 1024 * 1024,
  allowedMimeTypes: new Set(['image/png', 'image/jpeg', 'image/webp'])
};
