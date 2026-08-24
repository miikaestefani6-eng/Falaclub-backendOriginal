import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

const MAX_AUDIO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/m4a',
  'audio/webm',
  'audio/ogg',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AUDIO_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_AUDIO_MIME_TYPES.has(file.mimetype)) {
      callback(new Error('Unsupported audio format'));
      return;
    }

    callback(null, true);
  },
});

export function audioUpload(request: Request, response: Response, next: NextFunction) {
  upload.single('file')(request, response, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      response.status(413).json({ error: 'Audio file exceeds 5MB limit' });
      return;
    }

    if (error instanceof Error && error.message === 'Unsupported audio format') {
      response.status(400).json({ error: 'Unsupported audio format' });
      return;
    }

    response.status(400).json({ error: 'Invalid audio upload' });
  });
}
