import { Request, Response, NextFunction } from 'express';
import { getTransactions, getTransactionById } from '../services/transaction';
import { TransactionType } from '../models/Transaction';

export async function getTransactionsController(req: Request, res: Response, next: NextFunction) {
    try {
        const { accountId } = req.params;
        const { type, startDate, endDate, limit, page } = req.query;
        const numLimit = parseInt(limit as string) || 10;
        const numPage = parseInt(page as string) || 1;
        const filter: any = {};

        if (type) {
            filter.type = type as TransactionType;
        }

        if (startDate) {
            filter.startDate = new Date(startDate as string);
        }

        if (endDate) {
            filter.endDate = new Date(endDate as string);
        }

        if (limit) {
            filter.limit = numLimit;
        }

        if (page) {
            filter.page = parseInt(page as string);
        }

        const transactions = await getTransactions(accountId, filter);

        const totalPages = Math.ceil(transactions.length / numLimit);
        res.status(200).json({
            page: numPage,
            limit: numLimit,
            totalPages,
            totalTransactions: transactions.length,
            data: transactions,
        });
    } catch (error) {
        next(error);
    }
}

export async function getTransactionByIdController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { transactionId } = req.params;
        const transaction = await getTransactionById(transactionId);

        res.status(200).json(transaction);
    } catch (error) {
        next(error);
    }
}
