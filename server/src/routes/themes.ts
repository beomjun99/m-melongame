import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import {
  createTheme,
  deleteTheme,
  ensureDefaultTheme,
  getTheme,
  listThemes,
  themeNameExists,
  upsertThemeImage
} from '../repositories/themeRepository.js';
import { deleteThemeUploadDirectory, themeImageUpload, toPublicUploadUrl } from '../services/themeUploadService.js';

type ThemeRequestBody = {
  name?: unknown;
};

function normalizeLevel(value: unknown) {
  const level = Number(value);

  if (!Number.isInteger(level) || level < 1 || level > 11) {
    return null;
  }

  return level;
}

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeThemeName(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const name = value.trim();

  if (name.length < 1 || name.length > 80) {
    return null;
  }

  return name;
}

async function validateThemeUploadTarget(req: Request, res: Response, next: NextFunction) {
  try {
    const themeId = getParamValue(req.params.themeId);
    const level = normalizeLevel(getParamValue(req.params.level));

    if (!themeId) {
      res.status(400).json({ error: 'themeId is required.' });
      return;
    }

    if (!level) {
      res.status(400).json({ error: 'level must be between 1 and 11.' });
      return;
    }

    const theme = await getTheme(themeId);

    if (!theme) {
      res.status(404).json({ error: 'Theme not found.' });
      return;
    }

    res.locals.themeId = themeId;
    res.locals.level = level;
    next();
  } catch (error) {
    next(error);
  }
}

export const themesRouter = Router();

themesRouter.get('/', async (_req, res, next) => {
  try {
    res.json({
      themes: await listThemes()
    });
  } catch (error) {
    next(error);
  }
});

themesRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body as ThemeRequestBody;
    const name = normalizeThemeName(body.name);

    if (!name) {
      res.status(400).json({ error: 'name is required and must be 80 characters or fewer.' });
      return;
    }

    if (await themeNameExists(name)) {
      res.status(409).json({ error: '이미 같은 이름의 라인업이 있습니다. 다른 이름을 입력해주세요.' });
      return;
    }

    res.status(201).json({
      theme: await createTheme(name)
    });
  } catch (error) {
    next(error);
  }
});

themesRouter.get('/default', async (_req, res, next) => {
  try {
    const themeId = await ensureDefaultTheme();
    const theme = await getTheme(themeId);

    res.json({ theme });
  } catch (error) {
    next(error);
  }
});

themesRouter.delete('/:themeId', async (req, res, next) => {
  try {
    const themeId = getParamValue(req.params.themeId);

    if (!themeId) {
      res.status(400).json({ error: 'themeId is required.' });
      return;
    }

    const theme = await getTheme(themeId);

    if (!theme) {
      res.status(404).json({ error: 'Theme not found.' });
      return;
    }

    if (theme.name === 'Default Custom Theme') {
      res.status(400).json({ error: '기본 라인업은 삭제할 수 없습니다.' });
      return;
    }

    await deleteTheme(themeId);
    await deleteThemeUploadDirectory(themeId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

themesRouter.get('/:themeId', async (req, res, next) => {
  try {
    const themeId = getParamValue(req.params.themeId);

    if (!themeId) {
      res.status(400).json({ error: 'themeId is required.' });
      return;
    }

    const theme = await getTheme(themeId);

    if (!theme) {
      res.status(404).json({ error: 'Theme not found.' });
      return;
    }

    res.json({ theme });
  } catch (error) {
    next(error);
  }
});

themesRouter.post('/:themeId/images/:level', validateThemeUploadTarget, themeImageUpload.single('image'), async (req, res, next) => {
  try {
    const themeId = res.locals.themeId as string;
    const level = res.locals.level as number;

    if (!req.file) {
      res.status(400).json({ error: 'image file is required.' });
      return;
    }

    res.status(201).json({
      theme: await upsertThemeImage(themeId, level, toPublicUploadUrl(req.file))
    });
  } catch (error) {
    next(error);
  }
});

themesRouter.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'Image must be 2MB or smaller.' });
    return;
  }

  if (error instanceof Error && error.message.includes('Only PNG')) {
    res.status(400).json({ error: error.message });
    return;
  }

  next(error);
});
