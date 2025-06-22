import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from '../db';
import { User } from '../models/User';
import { Collection } from 'mongodb';
import { OperationalError } from '../middlewares/error';

const JWT_SECRET = process.env.JWT_SECRET || 'axis-pay-secure-jwt-secret-key';
const JWT_EXPIRES_IN = '1y';
const SALT_ROUNDS = 10;

const getUserCollection = (): Collection<any> => getDb().collection<User>('users');

export async function registerUser(userData: User & { password: string }): Promise<string> {
    const userCollection = getUserCollection();

    const existingUser = await userCollection.findOne({
        $or: [
            { nationalId: userData.nationalId },
            { email: userData.email },
            { mobileNumber: userData.mobileNumber },
        ],
    });
    if (existingUser) {
        throw OperationalError.conflict('User already exists.');
    }

    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const newUser: User = {
        nationalId: userData.nationalId,
        mobileNumber: userData.mobileNumber,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordHash,
        idExpiryDate: new Date(userData.idExpiryDate),
        governorate: userData.governorate,
        city: userData.city,
        address: userData.address,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    try {
        await userCollection.insertOne(newUser);
        return userData.nationalId;
    } catch (_error) {
        throw OperationalError.internal('Failed to register user.');
    }
}

export async function loginUser(
    mobileNumber: string,
    password: string
): Promise<{ token: string; user: Omit<User, 'passwordHash'> }> {
    const userCollection = getUserCollection();

    const user = await userCollection.findOne({ mobileNumber });
    if (!user) {
        throw OperationalError.unauthorized('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        throw OperationalError.unauthorized('Invalid credentials.');
    }

    const token = jwt.sign(
        {
            id: user._id.toString(),
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    const { passwordHash, ...userWithoutPassword } = user;

    return {
        token,
        user: userWithoutPassword,
    };
}

export async function changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
): Promise<boolean> {
    const userCollection = getUserCollection();
    if (!id) {
        throw OperationalError.badRequest(
            'Some error occurred while changing password, please try again later.'
        );
    }

    const user = await userCollection.findOne({ _id: id });
    if (!user) {
        throw OperationalError.notFound('User');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
        throw OperationalError.unauthorized('Current password is incorrect.');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const passwordChangedAt = Date.now() - 1000;
    const result = await userCollection.updateOne(
        { _id: id },
        {
            $set: {
                passwordHash: newPasswordHash,
                updatedAt: new Date(),
                passwordChangedAt,
            },
        }
    );

    return result.modifiedCount > 0;
}
