const crypto = require('crypto').webcrypto;
const { TextEncoder, TextDecoder } = require('util');
const { defaults } = require('jest-config');
// Polyfill for encoding which isn't present globally in jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.crypto = crypto;

module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.spec.[jt]s?(x)'],
  globals: {
    ...defaults.globals,
    crypto,
    TextEncoder,
    TextDecoder,
  },
  verbose: true,
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!@assemblyscript/.*)'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
};
