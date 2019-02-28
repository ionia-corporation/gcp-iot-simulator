import jwt from 'jsonwebtoken';

export const createJWT = (projectId: string, privateKey: string, algorithm: string) => {
// Create a Cloud IoT Core JWT for the given project id, signed with the given
// private key.

  const token = {
      'iat': (Date.now() / 1000),
      'exp': (Date.now() / 1000) + 20 * 60, // 20 minutes
      'aud': projectId
  };
  // Create a JWT to authenticate this device. The device will be disconnected
  // after the token expires, and will have to reconnect with a new token. The
  // audience field should always be set to the GCP project id.

  return jwt.sign(token, privateKey, { algorithm: algorithm });
}
