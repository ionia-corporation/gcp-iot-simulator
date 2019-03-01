import { createJWT } from './utils';
import https from 'https';
import enviornment from '../enviornment';

export const getToken = (): Promise<string> => {
  const devicePath = `projects/${enviornment.projectId}/locations/${enviornment.region}/registries/${enviornment.registryId}/devices/${enviornment.deviceId}`;
  const tokenEndpoint = `https://cloudiottoken.googleapis.com/v1beta1/${devicePath}:generateFirebaseToken`;

  return new Promise((resolve, reject) => {
    https.request(
      tokenEndpoint,
      {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${createJWT(enviornment.projectId, enviornment.privateKey, enviornment.algorithm)}`,
          'content-type': 'application/json',
        }

      },
      (res) => {
        const chunks: string[] = [];
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        res.on('end', () => {
          const body = chunks.join();
          const response = JSON.parse(body);
          resolve(response.token as string);
        });
      }
    )
    .on('error', reject)
    .end();
  });
}

export const downloadFile = (url: string, firebaseToken: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    https.request(
      url,
      {
        headers: {
          'authorization': `Firebase ${firebaseToken}`
        }
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          resolve(body);
        });
      }
    )
    .on('error', reject)
    .end();
  });
}
