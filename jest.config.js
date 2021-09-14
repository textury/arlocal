const crypto = require('crypto').webcrypto;
const { TextEncoder, TextDecoder } = require('util');
const {ArrayBuffer} = require('buffer');
const {defaults} = require('jest-config');
// Polyfill for encoding which isn't present globally in jsdom
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ArrayBuffer = ArrayBuffer;
global.crypto = crypto;

module.exports = {
  preset: 'ts-jest',
  testMatch: ["**/__tests__/**/*.[jt]s?(x)"],
  globals: {
    ...defaults.globals,
    crypto,
    TextEncoder,
    TextDecoder,
    ArrayBuffer,
  },
  verbose: true,
};
