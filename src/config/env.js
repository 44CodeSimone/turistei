'use strict';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',

  jwtSecret: required('JWT_SECRET'),

  testUser: {
    email: required('TURISTEI_TEST_EMAIL'),
    password: required('TURISTEI_TEST_PASSWORD')
  },

  platform: {
    commissionPercent: Number(process.env.PLATFORM_COMMISSION_PERCENT || 0)
  }
};
