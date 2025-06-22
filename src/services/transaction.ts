import { getDb } from '../db';
import { Transaction, TransactionType } from '../models/Transaction';
import { Collection } from 'mongodb';
import { getAccountDetails } from './account';
import { OperationalError } from '../middlewares/error';

const getTransactionCollection = (): Collection<Transaction> =>
    getDb().collection<Transaction>('transactions');

export async function getTransactions(
    accountId: string,
    filter?: {
        type?: TransactionType;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        page?: number;
    }
): Promise<Transaction[]> {
    await getAccountDetails(accountId);

    const query: any = { accountId };

    if (filter?.type) {
        query.type = filter.type;
    }

    if (filter?.startDate || filter?.endDate) {
        query.createdAt = {};
        if (filter?.startDate) {
            query.createdAt.$gte = filter.startDate;
        }
        if (filter?.endDate) {
            query.createdAt.$lte = filter.endDate;
        }
    }
    let data = getTransactionCollection().find(query);
    data = data.sort({ createdAt: -1 });

    if (filter?.page) {
        data = data.skip((filter.page - 1) * (filter?.limit || 10));
    }

    if (filter?.limit) {
        data = data.limit(filter.limit);
    }
    const transactions = await data.toArray();
    try {
        return transactions;
    } catch (_error) {
        throw OperationalError.internal('Failed to retrieve transactions.');
    }
}

export async function getTransactionById(transactionId: string): Promise<Transaction> {
    const transaction = await getTransactionCollection().findOne({
        transactionId,
    });

    if (!transaction) {
        throw OperationalError.notFound('Transaction');
    }

    return transaction;
}
