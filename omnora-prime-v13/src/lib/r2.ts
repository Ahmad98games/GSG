import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'b90a671a7d91009c9f0dd8e690f0c446';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '55bc954863afa10f8b64441d1068bffc';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '24dcd73108b450b53eb12e2a0152a610f135cea14c60f114c69b89a088bc680e';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'noxishub';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generates a Cloudflare R2 presigned download URL for a given object.
 * @param fileName Object key in R2 bucket (e.g. 'Noxis-Hub-Setup-1.0.0.exe')
 * @param expiresInSeconds Duration in seconds for link validity (default: 900s / 15 mins)
 */
export async function generateDownloadUrl(fileName: string, expiresInSeconds = 900): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
  });

  const signedUrl = await getSignedUrl(r2Client, command, {
    expiresIn: expiresInSeconds,
  });

  return signedUrl;
}
