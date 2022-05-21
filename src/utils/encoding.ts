import * as B64js from 'base64-js';
import { base32 } from 'rfc4648';
import { createHash } from 'crypto';
import { Readable, PassThrough, Transform } from 'stream';
import { Tag } from '../faces/arweave';

export type Base64EncodedString = string;
export type Base64UrlEncodedString = string;
export type WinstonString = string;
export type ArString = string;
export type ISO8601DateTimeString = string;

export class Base64DUrlecode extends Transform {
  protected extra: string;
  protected bytesProcessed: number;

  constructor() {
    super({ decodeStrings: false, objectMode: false });
    this.extra = '';
    this.bytesProcessed = 0;
  }

  _transform(chunk: Buffer, _: any, cb: () => void) {
    const conbinedChunk =
      this.extra +
      chunk
        .toString('base64')
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .replace(/(\r\n|\n|\r)/gm, '');

    this.bytesProcessed += chunk.byteLength;

    const remaining = chunk.length % 4;

    this.extra = conbinedChunk.slice(chunk.length - remaining);

    const buf = Buffer.from(conbinedChunk.slice(0, chunk.length - remaining), 'base64');
    this.push(buf);
    cb();
  }

  _flush(cb: () => void) {
    if (this.extra.length) {
      this.push(Buffer.from(this.extra, 'base64'));
    }

    cb();
  }
}

export function b64UrlToBuffer(b64UrlString: string): Uint8Array {
  return new Uint8Array(B64js.toByteArray(b64UrlDecode(b64UrlString)));
}

export function b64UrlDecode(b64UrlString: string): string {
  b64UrlString = b64UrlString.replace(/\-/g, '+').replace(/\_/g, '/');
  let padding;
  b64UrlString.length % 4 === 0 ? (padding = 0) : (padding = 4 - (b64UrlString.length % 4));
  return b64UrlString.concat('='.repeat(padding));
}

export function sha256(buffer: Buffer): Buffer {
  return createHash('sha256').update(buffer).digest();
}

export function toB64url(buffer: Buffer | string): Base64UrlEncodedString {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function fromB64Url(input: Base64UrlEncodedString): Buffer {
  const paddingLength = input.length % 4 === 0 ? 0 : 4 - (input.length % 4);

  const base64 = input.replace(/-/g, '+').replace(/_/g, '/').concat('='.repeat(paddingLength));

  return Buffer.from(base64, 'base64');
}

export function fromB32(input: string): Buffer {
  return Buffer.from(
    base32.parse(input, {
      loose: true,
    }),
  );
}

export function toB32(input: Buffer): string {
  return base32.stringify(input, { pad: false }).toLowerCase();
}

export function sha256B64Url(input: Buffer): string {
  return toB64url(createHash('sha256').update(input).digest());
}

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  let buffer = Buffer.alloc(0);
  return new Promise((resolve) => {
    stream.on('data', (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);
    });

    stream.on('end', () => {
      resolve(buffer);
    });
  });
}

export async function streamToString(stream: Readable): Promise<string> {
  return (await streamToBuffer(stream)).toString('utf-8');
}

export function bufferToJson<T = any | undefined>(input: Buffer): T {
  return JSON.parse(input.toString('utf8'));
}

export function jsonToBuffer(input: object): Buffer {
  return Buffer.from(JSON.stringify(input));
}

export async function streamToJson<T = any | undefined>(input: Readable): Promise<T> {
  return bufferToJson<T>(await streamToBuffer(input));
}

export function isValidUTF8(buffer: Buffer) {
  return Buffer.compare(Buffer.from(buffer.toString(), 'utf8'), buffer) === 0;
}

export function streamDecoderb64url(readable: Readable): Readable {
  const outputStream = new PassThrough({ objectMode: false });

  const decoder = new Base64DUrlecode();

  readable.pipe(decoder).pipe(outputStream);

  return outputStream;
}

export function bufferToStream(buffer: Buffer) {
  return new Readable({
    objectMode: false,
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
}

export function utf8DecodeTag(tag: Tag): { name: string | undefined; value: string | undefined } {
  let name;
  let value;
  try {
    const nameBuffer = fromB64Url(tag.name);
    if (isValidUTF8(nameBuffer)) {
      name = nameBuffer.toString('utf8');
    }
    const valueBuffer = fromB64Url(tag.value);
    if (isValidUTF8(valueBuffer)) {
      value = valueBuffer.toString('utf8');
    }
  } catch (error) {}
  return {
    name,
    value,
  };
}

export async function hash(data: Uint8Array, algorithm: string = 'SHA-256'): Promise<Uint8Array> {
  return createHash(parseHashAlgorithm(algorithm)).update(data).digest();
}

export function bufferTob64(buffer: Uint8Array): string {
  return B64js.fromByteArray(buffer);
}

export function bufferTob64Url(buffer: Uint8Array): string {
  return b64UrlEncode(bufferTob64(buffer));
}

export function b64UrlEncode(b64UrlString: string): string {
  return b64UrlString.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
}

function parseHashAlgorithm(algorithm: string): string {
  switch (algorithm) {
    case 'SHA-256':
      return 'sha256';
    case 'SHA-384':
      return 'sha384';
    default:
      throw new Error(`Algorithm not supported: ${algorithm}`);
  }
}

export const parseB64UrlOrThrow = (b64urlString: string, fieldName: string) => {
  try {
    return fromB64Url(b64urlString);
  } catch (error) {
    throw new Error(`missing field: ${fieldName}`);
  }
};

export function sha256Hex(data: string) {
  return createHash('sha256').update(data).digest('hex');
}
