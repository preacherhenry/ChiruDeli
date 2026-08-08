/**
 * Every uploaded document (store registration documents, licences, ...)
 * goes through this interface so storage can move from "base64 in Postgres"
 * to a real object store (S3/Cloudflare R2) later without touching any
 * caller — same swappable-provider pattern as lib/payments.ts and lib/sms.ts.
 */
export interface DocumentStorageProvider {
  /** Returns provider-opaque content to persist on StoreDocument.fileData. */
  store(fileData: string, mimeType: string): Promise<string>;
  /** Returns the same content back out, in the shape callers can render/download. */
  retrieve(stored: string, mimeType: string): Promise<string>;
}

const MAX_BYTES = 6_000_000; // ~6MB decoded; keeps Postgres rows and Fastify bodies sane

/**
 * Dev/default implementation: the "content" IS the base64 string, stored
 * directly on the row. No external account needed, survives redeploys
 * (unlike local disk, which Render wipes). Swap for an S3Provider later.
 */
export class PostgresBase64DocumentProvider implements DocumentStorageProvider {
  async store(fileData: string, _mimeType: string): Promise<string> {
    const approxBytes = Math.ceil((fileData.length * 3) / 4);
    if (approxBytes > MAX_BYTES) {
      throw new Error('File is too large (max ~6MB).');
    }
    return fileData;
  }

  async retrieve(stored: string): Promise<string> {
    return stored;
  }
}

export const documentStorageProvider: DocumentStorageProvider = new PostgresBase64DocumentProvider();

/** `data:` URI the frontend can drop straight into an <img>/<a href> or download link. */
export function toDataUri(fileData: string, mimeType: string): string {
  return `data:${mimeType};base64,${fileData}`;
}
