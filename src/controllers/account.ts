import { Request, Response, NextFunction } from 'express';
import {
    createAccount,
    depositFunds,
    withdrawFunds,
    getAccountBalance,
    getAccountDetails,
    getAccountTransactions,
} from '../services/account';

export async function createAccountController(req: Request, res: Response, next: NextFunction) {
    try {
        const { nationalId, initialDeposit } = req.body;

        await createAccount(nationalId, initialDeposit);

        res.status(201).json({
            nationalId,
            message: 'Account created successfully',
        });
    } catch (error) {
        next(error);
    }
}

export async function depositFundsController(req: Request, res: Response, next: NextFunction) {
    try {
        const { accountId } = req.params;
        const { amount, description } = req.body;

        const transactionId = await depositFunds(accountId, amount, description);

        res.status(200).json({
            transactionId,
            message: 'Funds deposited successfully',
        });
    } catch (error) {
        next(error);
    }
}

export async function withdrawFundsController(req: Request, res: Response, next: NextFunction) {
    try {
        const { accountId } = req.params;
        const { amount, description } = req.body;

        const transactionId = await withdrawFunds(accountId, amount, description);

        res.status(200).json({
            transactionId,
            message: 'Funds withdrawn successfully',
        });
    } catch (error) {
        next(error);
    }
}

export async function getAccountBalanceController(req: Request, res: Response, next: NextFunction) {
    try {
        const { accountId } = req.params;
        const balance = await getAccountBalance(accountId);

        res.status(200).json({
            accountId,
            balance,
        });
    } catch (error) {
        next(error);
    }
}

export async function getAccountDetailsController(req: Request, res: Response, next: NextFunction) {
    try {
        const { accountId } = req.params;
        const account = await getAccountDetails(accountId);

        res.status(200).json(account);
    } catch (error) {
        next(error);
    }
}

export async function getAccountTransactionsController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { accountId } = req.params;
        const transactions = await getAccountTransactions(accountId);

        res.status(200).json({
            data: transactions,
        });
    } catch (error) {
        next(error);
    }
}
