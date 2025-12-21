import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  bbc: {
    baseUrl: process.env.BBC_BASE_URL || 'https://www.bbc.co.uk',
  },
};
