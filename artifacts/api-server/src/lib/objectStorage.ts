import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function parseObjectPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const segments = normalized.split("/");
  if (segments.length < 3 || !segments[1]) {
    throw new Error("Invalid object storage path");
  }
  return {
    bucketName: segments[1],
    objectName: segments.slice(2).join("/"),
  };
}

function privateObjectRoot() {
  const directory = process.env.PRIVATE_OBJECT_DIR?.replace(/\/+$/, "");
  if (!directory) throw new Error("Private object storage is not configured");
  return directory;
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT";
  ttlSec: number;
}) {
  const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Could not sign object URL (${response.status})`);
  const result = (await response.json()) as { signed_url?: string };
  if (!result.signed_url) throw new Error("Storage did not return a signed URL");
  return result.signed_url;
}

export class ObjectStorageService {
  async createUpload(userId: string) {
    const objectId = randomUUID();
    const objectPath = `/objects/${userId}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(
      `${privateObjectRoot()}/${userId}/uploads/${objectId}`,
    );
    const uploadURL = await signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
    return { uploadURL, objectPath };
  }

  async getReadURL(objectPath: string) {
    const prefix = "/objects/";
    if (!objectPath.startsWith(prefix)) throw new Error("Invalid object path");
    const entityPath = objectPath.slice(prefix.length);
    const { bucketName, objectName } = parseObjectPath(`${privateObjectRoot()}/${entityPath}`);
    return signObjectURL({
      bucketName,
      objectName,
      method: "GET",
      ttlSec: 3600,
    });
  }

  async getMetadata(objectPath: string) {
    const prefix = "/objects/";
    if (!objectPath.startsWith(prefix)) throw new Error("Invalid object path");
    const entityPath = objectPath.slice(prefix.length);
    const { bucketName, objectName } = parseObjectPath(`${privateObjectRoot()}/${entityPath}`);
    const [metadata] = await objectStorageClient.bucket(bucketName).file(objectName).getMetadata();
    return metadata;
  }
}
