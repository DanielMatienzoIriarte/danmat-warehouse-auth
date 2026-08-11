import dotenv from 'dotenv';
dotenv.config();

// Helper to format PEM keys from environment variables safely
const formatKey = (keyString: string | undefined): string => {
  if (!keyString) return '';
  return keyString.replace(/\\n/g, '\n');
};

export const JWT_PRIVATE_KEY = formatKey(process.env.JWT_PRIVATE_KEY);
export const JWT_PUBLIC_KEY = formatKey(process.env.JWT_PUBLIC_KEY);

if (!JWT_PRIVATE_KEY || !JWT_PUBLIC_KEY) {
  console.warn('WARNING: RSA Private or Public keys are missing. RS256 signing will fail unless configured in .env');
}