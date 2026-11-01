import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/banana-arena',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  bananaApiUrl: process.env.BANANA_API_URL || 'https://marcconrad.com/uob/banana/api.php?out=json&base64=no',
  isProd: process.env.NODE_ENV === 'production',
};
