import { NextFunction, Request, Response } from 'express';
import { registerUser, loginUser, changePassword } from '../services/auth';

export async function registerController(req: Request, res: Response, next: NextFunction) {
    try {
        const userData = req.body;
        const userId = await registerUser(userData);

        res.status(201).json({
            userId,
            message: 'User registered successfully',
        });
    } catch (error) {
        next(error);
    }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
    try {
        const { mobileNumber, password } = req.body;
        const { token, user } = await loginUser(mobileNumber, password);

        res.status(200).json({
            token,
            user,
            message: 'Login successful',
        });
    } catch (error) {
        next(error);
    }
}

export async function changePasswordController(req: any, res: Response, next: NextFunction) {
    try {
        const { id } = req?.user as { id: string };
        const { currentPassword, newPassword } = req.body;

        await changePassword(id, currentPassword, newPassword);

        res.status(200).json({
            message: 'Password changed successfully',
        });
    } catch (error) {
        next(error);
    }
}
