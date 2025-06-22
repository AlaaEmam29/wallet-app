import { Router } from 'express';
import {
    createAccountController,
    depositFundsController,
    withdrawFundsController,
    getAccountBalanceController,
    getAccountDetailsController,
    getAccountTransactionsController,
} from '../controllers/account';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import {
    createAccountSchema,
    accountIdParamSchema,
    transactionAmountSchema,
} from '../validations/account';

const router = Router();

router
    .post('/', validate(createAccountSchema), createAccountController)
    .post(
        '/:accountId/deposit',
        authMiddleware,
        validate(accountIdParamSchema),
        validate(transactionAmountSchema),
        depositFundsController
    )
    .post(
        '/:accountId/withdraw',
        authMiddleware,
        validate(accountIdParamSchema),
        validate(transactionAmountSchema),
        withdrawFundsController
    );

router
    .get('/:accountId', authMiddleware, validate(accountIdParamSchema), getAccountDetailsController)
    .get(
        '/:accountId/balance',
        authMiddleware,
        validate(accountIdParamSchema),
        getAccountBalanceController
    )
    .get(
        '/:accountId/transactions',
        authMiddleware,
        validate(accountIdParamSchema),
        getAccountTransactionsController
    );

export default router;
