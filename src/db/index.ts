import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let url = process.env.MONGODB_URI;
const password = process.env.MONGODB_PASS;
if (!url || !password) {
    console.error('Something went wrong');
    process.exit(1);
}

let client: MongoClient;
let db: Db;

async function connectDB(): Promise<void> {
    if (client && db) return;

    try {
        const completeUrl = url?.replace('<db_password>', password!);
        client = new MongoClient(completeUrl!);
        await client.connect();
        db = client.db();
        console.log('Successfully connected to MongoDB');
        try {
            await db.command({ ping: 1 });
            const accounts = db.collection('accounts');
            const users = db.collection('users');
            const transactions = db.collection('transactions');
            await users.createIndex({ mobileNumber: 1 }, { unique: true });
            await users.createIndex({ email: 1 }, { unique: true });
            await users.createIndex({ nationalId: 1 }, { unique: true });
            await accounts.createIndex({ nationalId: 1 }, { unique: true });
            await transactions.createIndex({ transactionId: 1 }, { unique: true });
            await transactions.createIndex({ accountId: 1 });

            console.log('Unique indexes created');
        } catch (indexError) {
            console.error('Error creating indexes:', indexError);
        }
    } catch (error) {
        console.log('Could not connect to MongoDB', error);
        process.exit(1);
    }
}

function getDb(): Db {
    if (!db) {
        process.exit(1);
    }
    return db;
}

function getClient(): MongoClient {
    if (!client) {
        process.exit(1);
    }
    return client;
}

export { connectDB, getDb, getClient };
