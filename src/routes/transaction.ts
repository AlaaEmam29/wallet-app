import { Router } from 'express';
import {
    getTransactionsController,
    getTransactionByIdController,
} from '../controllers/transaction';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router
    .get('/account/:accountId', authMiddleware, getTransactionsController)
    .get('/:transactionId', authMiddleware, getTransactionByIdController);

export default router;
