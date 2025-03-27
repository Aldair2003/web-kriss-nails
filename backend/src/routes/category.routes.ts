import { Router } from 'express';
import { 
  getCategories, 
  getCategory, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  updateCategoryOrder
} from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { AsyncRequestHandler } from '../types/express.js';

const router = Router();

// Rutas públicas
router.get('/', getCategories as unknown as AsyncRequestHandler);
router.get('/:id', getCategory as unknown as AsyncRequestHandler);

// Rutas protegidas (solo admin)
router.post('/', 
  authMiddleware as unknown as AsyncRequestHandler, 
  createCategory as unknown as AsyncRequestHandler
);

router.put('/:id', 
  authMiddleware as unknown as AsyncRequestHandler, 
  updateCategory as unknown as AsyncRequestHandler
);

router.delete('/:id', 
  authMiddleware as unknown as AsyncRequestHandler, 
  deleteCategory as unknown as AsyncRequestHandler
);

router.put('/order/update', 
  authMiddleware as unknown as AsyncRequestHandler, 
  updateCategoryOrder as unknown as AsyncRequestHandler
);

export default router; 