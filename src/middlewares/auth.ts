import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OperationalError } from './error';
import { getDb } from '../db';
import { User } from '../models/User';
import { Collection, ObjectId } from 'mongodb';
const JWT_SECRET = process.env.JWT_SECRET || 'axis-pay-secure-jwt-secret-key';
const getUserCollection = (): Collection<User> => getDb().collection<User>('users');

export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(
                OperationalError.unauthorized('You are not authorized to access this resource.')
            );
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return next(
                OperationalError.unauthorized('You are not authorized to access this resource.')
            );
        }

        const decoded = jwt.verify(token, JWT_SECRET) as {
            id: string;
            iat: number;
        };
        const userCollection = getUserCollection();
        const existingUser = await userCollection.findOne({
            _id: new ObjectId(decoded.id),
        });
        if (!existingUser) {
            return next(OperationalError.conflict('User no longer exists.'));
        }
        const changedTimestamp = existingUser.passwordChangedAt?.getTime() || 0;
        const tokenTimestamp = decoded.iat * 1000;
        if (tokenTimestamp < changedTimestamp) {
            return next(
                OperationalError.unauthorized('Token is no longer valid due to password change.')
            );
        }
        req.user = {
            id: new ObjectId(decoded.id),
        };
        next();
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(OperationalError.fromJwtError(error, req.originalUrl));
        }

        next(error);
    }
};
