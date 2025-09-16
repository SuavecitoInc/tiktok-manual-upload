import * as dotenv from 'dotenv';
dotenv.config();

export const API_VERSION = process.env.SHOPIFY_ADMMIN_API_VERSION || '2025-07';

export const STORE = process.env.SHOPIFY_STORE || 'suavecito';

export const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';
