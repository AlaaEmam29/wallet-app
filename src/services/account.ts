import { getDb, getClient } from '../db';
import { Account } from '../models/Account';
import { Transaction, TransactionType, TransactionStatus } from '../models/Transaction';
import { Collection } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { OperationalError } from '../middlewares/error';
const getAccountCollection = (): Collection<Account> => getDb().collection<Account>('accounts');
const getTransactionCollection = (): Collection<Transaction> =>
    getDb().collection<Transaction>('transactions');

export async function createAccount(
    nationalId: string,
    initialDeposit: number = 0
): Promise<string> {
    const accountsCollection = getAccountCollection();

    const existingAccount = await accountsCollection.findOne({ nationalId });
    if (existingAccount) {
        throw OperationalError.conflict(`Account with National ID ${nationalId} already exists.`);
    }
    const newAccount: Account = {
        nationalId,
        balance: initialDeposit,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active' as any,
    };

    try {
        await accountsCollection.insertOne(newAccount);

        if (initialDeposit > 0) {
            await recordTransaction(nationalId, initialDeposit, TransactionType.DEPOSIT);
        }

        return nationalId;
    } catch (_error) {
        throw OperationalError.internal('Failed to create account.');
    }
}

async function recordTransaction(
    accountId: string,
    amount: number,
    type: TransactionType,
    description?: string
): Promise<string> {
    const transactionId = uuidv4();
    const transaction: Transaction = {
        transactionId,
        accountId,
        type,
        amount,
        description: description || (type === TransactionType.DEPOSIT ? 'Deposit' : 'Withdrawal'),
        status: TransactionStatus.COMPLETED,
        createdAt: new Date(),
    };

    await getTransactionCollection().insertOne(transaction);
    return transactionId;
}


export async function depositFunds(
    accountId: string,
    amount: number,
    description?: string
): Promise<string> {
    try {
        const accountsCollection = getAccountCollection();
        const account = await accountsCollection.findOne({ nationalId: accountId });

        if (!account) {
            throw OperationalError.notFound('Account');
        }

        const transactionId = uuidv4();
        const transaction: Transaction = {
            transactionId,
            accountId,
            type: TransactionType.DEPOSIT,
            amount,
            description: description || 'Deposit',
            status: TransactionStatus.PENDING,
            createdAt: new Date(),
        };

        await getTransactionCollection().insertOne(transaction);

        try {
            const updateResult = await accountsCollection.updateOne(
                { nationalId: accountId },
                {
                    $inc: { balance: amount },
                    $set: { updatedAt: new Date() },
                }
            );

            if (updateResult.matchedCount === 0) {
                await getTransactionCollection().updateOne(
                    { transactionId },
                    { $set: { status: TransactionStatus.FAILED } }
                );
                throw OperationalError.notFound('Account');
            }

            await getTransactionCollection().updateOne(
                { transactionId },
                { $set: { status: TransactionStatus.COMPLETED } }
            );

            return transactionId;
        } catch (error) {
            await getTransactionCollection().updateOne(
                { transactionId },
                { $set: { status: TransactionStatus.FAILED } }
            );
            throw error;
        }
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw OperationalError.internal('Failed to deposit funds.');
    }
}

export async function withdrawFunds(
    accountId: string,
    amount: number,
    description?: string
): Promise<string> {
    try {
        const accountsCollection = getAccountCollection();
        const account = await accountsCollection.findOne({ nationalId: accountId });

        if (!account) {
            throw OperationalError.notFound('Account');
        }

        if (account.balance < amount) {
            throw OperationalError.insufficientFunds();
        }

        const transactionId = uuidv4();
        const transaction: Transaction = {
            transactionId,
            accountId,
            type: TransactionType.WITHDRAWAL,
            amount,
            description: description || 'Withdrawal',
            status: TransactionStatus.PENDING,
            createdAt: new Date(),
        };

        await getTransactionCollection().insertOne(transaction);

        try {
            const updateResult = await accountsCollection.updateOne(
                {
                    nationalId: accountId,
                    balance: { $gte: amount }, 
                },
                {
                    $inc: { balance: -amount },
                    $set: { updatedAt: new Date() },
                }
            );

            if (updateResult.matchedCount === 0) {
                await getTransactionCollection().updateOne(
                    { transactionId },
                    { $set: { status: TransactionStatus.FAILED } }
                );

                const currentAccount = await accountsCollection.findOne({ nationalId: accountId });
                if (!currentAccount) {
                    throw OperationalError.notFound('Account');
                } else if (currentAccount.balance < amount) {
                    throw OperationalError.insufficientFunds();
                } else {
                    throw OperationalError.internal('Failed to update account balance.');
                }
            }

            await getTransactionCollection().updateOne(
                { transactionId },
                { $set: { status: TransactionStatus.COMPLETED } }
            );

            return transactionId;
        } catch (error) {
            await getTransactionCollection().updateOne(
                { transactionId },
                { $set: { status: TransactionStatus.FAILED } }
            );
            throw error;
        }
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw OperationalError.internal('Failed to withdraw funds.');
    }
}

export async function getAccountBalance(accountId: string): Promise<number> {
    const accountsCollection = getAccountCollection();
    const account = await accountsCollection.findOne({ nationalId: accountId });

    if (!account) {
        throw OperationalError.notFound('Account');
    }

    return account.balance;
}

export async function getAccountDetails(accountId: string): Promise<Account | null> {
    const accountsCollection = getAccountCollection();
    const account = await accountsCollection.findOne({ nationalId: accountId });

    if (!account) {
        throw OperationalError.notFound('Account');
    }

    return account;
}

export async function getAccountTransactions(accountId: string): Promise<Transaction[]> {
    const accountsCollection = getAccountCollection();
    const account = await accountsCollection.findOne({ nationalId: accountId });

    if (!account) {
        throw OperationalError.notFound('Account');
    }

    const transactionsCollection = getTransactionCollection();
    return await transactionsCollection.find({ accountId }).sort({ createdAt: -1 }).toArray();
}
