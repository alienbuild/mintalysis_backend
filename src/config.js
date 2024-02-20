import * as dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
    PORT: process.env.PORT || 8001,
    BASE_URL: process.env.FRONTEND_URL,
    MONGO_DB: process.env.MONGO_DB,
    CORS_OPTIONS: {
        methods: ['GET', 'POST', 'OPTIONS'],
        origin: [
            process.env.FRONTEND_URL,
            '67.225.248.251',
            '81.136.110.55',
            'http://localhost:3002',
            'http://localhost:3000'
        ],
        credentials: true,
    },
};
