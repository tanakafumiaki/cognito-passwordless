import { ResourcesConfig } from 'aws-amplify'

export const awsConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.VITE_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.VITE_COGNITO_USER_POOL_CLIENT_ID || '',
      identityPoolId: process.env.VITE_COGNITO_IDENTITY_POOL_ID || '',
      allowGuestAccess: true,
      signUpVerificationMethod: 'code',
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  Storage: {
    S3: {
      bucket: process.env.VITE_S3_BUCKET || '',
      region: process.env.VITE_AWS_REGION || 'ap-northeast-1',
    },
  },
}

export const sesConfig = {
  region: process.env.VITE_AWS_REGION || 'ap-northeast-1',
  accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || '',
}