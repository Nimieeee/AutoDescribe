import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a new pool using the connection string or environment variables
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'autodescribe',
    password: process.env.DB_PASSWORD || 'autodescribe_secret_password',
    port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
    getClient: () => pool.connect(),
};
