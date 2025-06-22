import { z } from 'zod';

const NATIONAL_ID_REGEX = /^([2-3])([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])([0-9]{7})$/;

export const transactionAmountSchema = z.object({
    body: z.object({
        amount: z.number().int().positive({
            message: 'Amount must be a positive integer value',
        }),
        description: z.string().optional(),
        reference: z.string().optional(),
    }),
});

export const transactionIdParamSchema = z.object({
    params: z.object({
        transactionId: z.string().uuid({
            message: 'Transaction ID must be a valid UUID',
        }),
    }),
});

export const accountIdParamSchema = z.object({
    params: z.object({
        accountId: z.string().regex(NATIONAL_ID_REGEX, {
            message: 'Account ID must be a valid Egyptian National ID',
        }),
    }),
});

export const transactionFilterSchema = z.object({
    query: z.object({
        type: z.enum(['deposit', 'withdrawal', 'transfer']).optional(),
        startDate: z
            .string()
            .refine((date) => !isNaN(Date.parse(date)), {
                message: 'Start date must be a valid date format',
            })
            .optional(),
        endDate: z
            .string()
            .refine((date) => !isNaN(Date.parse(date)), {
                message: 'End date must be a valid date format',
            })
            .optional(),
        limit: z
            .string()
            .refine((val) => !isNaN(parseInt(val)), {
                message: 'Limit must be a valid number',
            })
            .optional(),
        skip: z
            .string()
            .refine((val) => !isNaN(parseInt(val)), {
                message: 'Skip must be a valid number',
            })
            .optional(),
    }),
});
