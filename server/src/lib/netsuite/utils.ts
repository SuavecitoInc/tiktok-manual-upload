import dotenv from 'dotenv';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { NetSuiteResponse } from './types';
dotenv.config();

export const nsAuthenticatedFetch = async (endpoint: string, data?: any) => {
  // production
  const accountID = process.env.NETSUITE_ACCT_ID;
  const token = {
    key: process.env.NETSUITE_ACCESS_TOKEN as string,
    secret: process.env.NETSUITE_TOKEN_SECRET as string,
  };
  const consumer = {
    key: process.env.NETSUITE_CONSUMER_KEY as string,
    secret: process.env.NETSUITE_CONSUMER_SECRET as string,
  };

  const requestData = {
    url: endpoint,
    method: data ? 'POST' : 'GET',
  };

  const oauth = new OAuth({
    consumer: consumer,
    signature_method: 'HMAC-SHA256',
    hash_function(base_string, key) {
      return crypto
        .createHmac('sha256', key)
        .update(base_string)
        .digest('base64');
    },
    realm: accountID,
  });

  const authorization = oauth.authorize(requestData, token);
  const header: OAuth.Header & {
    'Content-Type'?: string;
    'user-agent'?: string;
  } = oauth.toHeader(authorization);
  header['Authorization'] += ', realm="' + accountID + '"';
  header['Content-Type'] = 'application/json';
  header['user-agent'] =
    'SuavecitoTikTokUploader/1.0 (Language=JavaScript/Node)';

  try {
    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: { ...header },
      body: data ? JSON.stringify(data) : undefined,
    });

    const json = await response.json();
    return json as NetSuiteResponse;
  } catch (err: any) {
    console.log('ERROR FETCHING FROM NETSUITE', err);
  }
};
