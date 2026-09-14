import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { uploadConfig } from '../config/upload.js';

const imageExtensionByMimeType: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp'
};

function getThemeUploadDirectory(themeId: string) {
  return path.join(uploadConfig.uploadRoot, 'themes', themeId);
}

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const themeImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, callback) => {
      const themeId = getParamValue(req.params.themeId) ?? 'unknown';
      const directory = getThemeUploadDirectory(themeId);

      fs.mkdirSync(directory, { recursive: true });
      callback(null, directory);
    },
    filename: (req, file, callback) => {
      const level = getParamValue(req.params.level) ?? 'unknown';
      const extension = imageExtensionByMimeType[file.mimetype] ?? path.extname(file.originalname);

      callback(null, `level-${level}-${Date.now()}${extension}`);
    }
  }),
  fileFilter: (_req, file, callback) => {
    if (!uploadConfig.allowedMimeTypes.has(file.mimetype)) {
      callback(new Error('Only PNG, JPG, JPEG, and WebP images are allowed.'));
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: uploadConfig.maxImageSizeBytes
  }
});

export function toPublicUploadUrl(file: Express.Multer.File) {
  const relativePath = path.relative(uploadConfig.uploadRoot, file.path).split(path.sep).join('/');

  return `${uploadConfig.publicPath}/${relativePath}`;
}
