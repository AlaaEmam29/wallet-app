import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { connectDB } from './db';
import accountRoutes from './routes/account';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transaction';
import { errorMiddleware } from './middlewares/error';
import { setupSwagger } from './doc/index';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

connectDB()
    .then(() => {
        app.use(morgan('combined'));
        app.use(
            express.json({
                limit: '10kb',
            })
        );
        app.use(express.urlencoded({ extended: true }));
        app.use(limiter);
        app.use(helmet());
        app.use(cors());
        app.use(mongoSanitize());
        app.use(
            hpp({
                whitelist: [
                    'amount',
                    'transactionType',
                    'accountId',
                    'mobileNumber',
                    'email',
                    'nationalId',
                    'limit',
                    'page',
                    'sort',
                    'fields',
                    'startDate',
                    'endDate',
                ],
            })
        );
        setupSwagger(app);
        app.get('/', (req: Request, res: Response) => {
            res.send('Axis Pay Backend Service is running!');
        });
        app.use('/api/accounts', accountRoutes);
        app.use('/api/auth', authRoutes);
        app.use('/api/transactions', transactionRoutes);
        app.use(errorMiddleware);

        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to the database. Server not started.', error);
        process.exit(1);
    });
