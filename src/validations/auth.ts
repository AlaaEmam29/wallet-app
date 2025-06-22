import { z } from 'zod';

const EGYPTIAN_MOBILE_NUMBER_REGEX = /^01(0|1|2|5){1}[0-9]{8}$/;

const NATIONAL_ID_REGEX = /^([2-3])([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])([0-9]{7})$/;

export const loginSchema = z.object({
    body: z.object({
        nationalId: z.string().regex(NATIONAL_ID_REGEX, {
            message: 'National ID must be a valid 14-digit Egyptian National ID',
        }),
        password: z.string().min(1, { message: 'Password is required' }),
    }),
});

export const registerSchema = z.object({
    body: z.object({
        nationalId: z.string().regex(NATIONAL_ID_REGEX, {
            message: 'National ID must be a valid 14-digit Egyptian National ID',
        }),
        mobileNumber: z.string().regex(EGYPTIAN_MOBILE_NUMBER_REGEX, {
            message: 'Mobile number must be a valid Egyptian mobile number format',
        }),
        firstName: z.string().min(2, {
            message: 'First name is required and must be at least 2 characters',
        }),
        lastName: z.string().min(2, {
            message: 'Last name is required and must be at least 2 characters',
        }),
        email: z.string().email({ message: 'Invalid email address format' }),
        governorate: z.string().min(2, { message: 'Governorate is required' }),
        city: z.string().min(2, { message: 'City is required' }),
        address: z.string().min(5, {
            message: 'Address is required and must be at least 5 characters',
        }),
        idExpiryDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: 'ID expiry date must be a valid date format',
        }),
        password: z.string().min(8, {
            message: 'Password must be at least 8 characters long',
        }),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, { message: 'Current password is required' }),
        newPassword: z
            .string()
            .min(8, { message: 'New password must be at least 8 characters long' }),
    }),
});
