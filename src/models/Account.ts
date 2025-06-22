import { ObjectId } from 'mongodb';

export interface Account {
    _id?: ObjectId;
    nationalId: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
    status: AccountStatus;
}

export enum AccountStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    CLOSED = 'closed',
}
