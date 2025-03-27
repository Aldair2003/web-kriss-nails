import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Configurar multer para almacenar archivos en memoria
const storage = multer.memoryStorage();

// Configurar límites y tipos de archivos permitidos
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    // Verificar tipo de archivo
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imágenes'));
    }
    cb(null, true);
  },
});

// Middleware para manejar la carga de un solo archivo
export const uploadMiddleware = upload.single('image');

// Middleware para manejar errores de carga
export const handleUploadErrors = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'El archivo es demasiado grande. Máximo 5MB permitido.',
      });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err.message === 'Solo se permiten imágenes') {
    return res.status(400).json({ message: err.message });
  }

  next(err);
}; 