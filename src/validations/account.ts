import { z } from 'zod';

const NATIONAL_ID_REGEX = /^([2-3])([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])([0-9]{7})$/;

export const createAccountSchema = z.object({
    body: z.object({
        nationalId: z
            .string({
                required_error: 'National ID is required',
            })
            .regex(NATIONAL_ID_REGEX, {
                message: 'National ID must be a valid 14-digit Egyptian National ID',
            }),
        initialDeposit: z.number().int().nonnegative().optional().default(0),
    }),
});

export const accountIdParamSchema = z.object({
    params: z.object({
        accountId: z
            .string({
                required_error: 'Account ID is required',
            })
            .regex(NATIONAL_ID_REGEX, {
                message: 'Account ID must be a valid Egyptian National ID',
            }),
    }),
});

export const transactionAmountSchema = z.object({
    body: z.object({
        amount: z
            .number({
                required_error: 'Amount is required',
            })
            .int()
            .positive({
                message: 'Amount must be a positive integer value',
            }),
        description: z.string().optional(),
    }),
});
