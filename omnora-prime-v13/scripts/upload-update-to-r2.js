/**
 * Robust Multipart Uploader for Noxis Hub installer to Cloudflare R2.
 * 
 * Uses S3 Multipart Upload (10MB chunks) to prevent HTTP timeouts on large binaries,
 * and uses server-side CopyObjectCommand to replicate keys instantly.
 */

const {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const R2_ACCOUNT_ID = 'b90a671a7d91009c9f0dd8e690f0c446';
const R2_ACCESS_KEY_ID = '55bc954863afa10f8b64441d1068bffc';
const R2_SECRET_ACCESS_KEY = '24dcd73108b450b53eb12e2a0152a610f135cea14c60f114c69b89a088bc680e';
const R2_BUCKET_NAME = 'noxishub';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function uploadSmall(localPath, r2Key, contentType = 'text/yaml') {
  const body = fs.readFileSync(localPath);
  console.log(`⬆ Uploading "${r2Key}" (${body.length} bytes)...`);
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: r2Key,
    Body: body,
    ContentType: contentType,
  }));
  console.log(`  ✓ Done: ${r2Key}`);
}

async function uploadLargeMultipart(localPath, r2Key, contentType = 'application/x-msdownload') {
  const fileStats = fs.statSync(localPath);
  const totalBytes = fileStats.size;
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB per part
  const numParts = Math.ceil(totalBytes / CHUNK_SIZE);

  console.log(`\n🚀 Starting multipart upload for "${r2Key}" (${totalMB} MB, ${numParts} parts)...`);

  const createRes = await client.send(new CreateMultipartUploadCommand({
    Bucket: R2_BUCKET_NAME,
    Key: r2Key,
    ContentType: contentType,
  }));
  const uploadId = createRes.UploadId;

  const parts = [];
  const fd = fs.openSync(localPath, 'r');

  try {
    for (let partNumber = 1; partNumber <= numParts; partNumber++) {
      const start = (partNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalBytes);
      const partLength = end - start;
      const buffer = Buffer.alloc(partLength);
      fs.readSync(fd, buffer, 0, partLength, start);

      const percent = ((end / totalBytes) * 100).toFixed(1);
      process.stdout.write(`  Part ${partNumber}/${numParts} (${(partLength / (1024 * 1024)).toFixed(1)} MB) [${percent}%]... `);

      const partRes = await client.send(new UploadPartCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: buffer,
      }));

      parts.push({
        PartNumber: partNumber,
        ETag: partRes.ETag,
      });

      console.log('✓');
    }

    fs.closeSync(fd);

    console.log('  Completing multipart upload on Cloudflare R2...');
    await client.send(new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    }));

    console.log(`✅ Finished uploading: ${r2Key}`);
  } catch (err) {
    fs.closeSync(fd);
    console.error(`❌ Multipart upload failed: ${err.message}`);
    try {
      await client.send(new AbortMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        UploadId: uploadId,
      }));
    } catch {}
    throw err;
  }
}

async function copyObjectServerSide(sourceKey, destKey) {
  console.log(`⚡ Server-side copy in R2: "${sourceKey}" → "${destKey}"...`);
  await client.send(new CopyObjectCommand({
    Bucket: R2_BUCKET_NAME,
    CopySource: `${R2_BUCKET_NAME}/${encodeURIComponent(sourceKey)}`,
    Key: destKey,
  }));
  console.log(`  ✓ Copied: ${destKey}`);
}

async function main() {
  const distDir = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ folder not found.');
    process.exit(1);
  }
  
  // 1. Upload manifests
  const stableYml = path.join(distDir, 'stable.yml');
  if (fs.existsSync(stableYml)) {
    await uploadSmall(stableYml, 'updates/stable/stable.yml', 'text/yaml');
    await uploadSmall(stableYml, 'updates/stable/latest.yml', 'text/yaml');
  }

  // 2. Upload the setup .exe using multipart
  const exeName = 'Noxis Hub Setup 13.0.1.exe';
  const exePath = path.join(distDir, exeName);
  if (fs.existsSync(exePath)) {
    const mainTargetKey = `updates/stable/${exeName}`;
    await uploadLargeMultipart(exePath, mainTargetKey, 'application/x-msdownload');

    // 3. Instant server-side copies to root download paths (instantaneous, 0 bandwidth!)
    await copyObjectServerSide(mainTargetKey, 'Noxis Setup 13.0.1.exe');
    await copyObjectServerSide(mainTargetKey, 'Noxis Setup 13.0.0.exe');
  } else {
    console.error(`❌ Could not find ${exePath}`);
    process.exit(1);
  }

  // 4. Verify bucket contents
  console.log('\n🔍 Verifying R2 bucket contents:');
  const list = await client.send(new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: 'updates/stable/',
  }));
  if (list.Contents) {
    for (const item of list.Contents) {
      console.log(`  ✓ ${item.Key} (${(item.Size / (1024 * 1024)).toFixed(2)} MB)`);
    }
  }

  console.log('\n🎉 ALL UPDATES AND DOWNLOADS ARE LIVE ON R2!');
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
