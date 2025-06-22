import { ObjectId } from 'mongodb';

export enum TransactionType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal',
    TRANSFER = 'transfer',
}

export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REVERSED = 'reversed',
}

export interface Transaction {
    _id?: ObjectId;
    transactionId: string;
    accountId: string;
    amount: number;
    type: TransactionType;
    description?: string;
    reference?: string;
    status: TransactionStatus;
    createdAt: Date;
}
