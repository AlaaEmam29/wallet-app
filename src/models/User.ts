import { ObjectId } from 'mongodb';

export interface User {
    _id?: ObjectId;
    nationalId: string;
    mobileNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    idExpiryDate: Date;
    governorate: string;
    city: string;
    address: string;
    createdAt: Date;
    updatedAt: Date;
    passwordChangedAt?: Date;
}
