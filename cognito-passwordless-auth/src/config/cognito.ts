import { ResourcesConfig } from 'aws-amplify'

export const cognitoConfig: ResourcesConfig = {
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
}