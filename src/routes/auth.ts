import { Router } from 'express';
import { registerController, loginController, changePasswordController } from '../controllers/auth';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router
    .post('/register', registerController)
    .post('/login', loginController)
    .post('/change-password', authMiddleware, changePasswordController);

export default router;
