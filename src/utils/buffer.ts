// to prevent circular deps between utils/utils.ts and utils/encoding.ts
export function concatBuffers(buffers: Uint8Array[] | ArrayBuffer[]): Uint8Array {
  let totalLength = 0;

  for (const buffer of buffers) {
    totalLength += buffer.byteLength;
  }

  const temp = new Uint8Array(totalLength);
  let offset = 0;

  temp.set(new Uint8Array(buffers[0]), offset);
  offset += buffers[0].byteLength;

  for (let i = 1; i < buffers.length; i++) {
    temp.set(new Uint8Array(buffers[i]), offset);
    offset += buffers[i].byteLength;
  }

  return temp;
}
