import { signIn, confirmSignIn, signOut, getCurrentUser } from 'aws-amplify/auth'
import type { AuthUser } from 'aws-amplify/auth'

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export class AuthService {
  private static instance: AuthService
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async initializeAuth(): Promise<void> {
    this.state.loading = true
    this.state.error = null

    try {
      const user = await getCurrentUser()
      this.state.user = user
      this.state.isAuthenticated = true
    } catch (error) {
      this.state.user = null
      this.state.isAuthenticated = false
    } finally {
      this.state.loading = false
    }
  }

  async sendAuthCode(email: string): Promise<void> {
    this.state.loading = true
    this.state.error = null

    try {
      await signIn({
        username: email,
        options: {
          authFlowType: 'CUSTOM_WITHOUT_SRP'
        }
      })
    } catch (error: any) {
      this.state.error = this.getErrorMessage(error)
      throw error
    } finally {
      this.state.loading = false
    }
  }

  async verifyAuthCode(code: string): Promise<void> {
    this.state.loading = true
    this.state.error = null

    try {
      const result = await confirmSignIn({
        challengeResponse: code
      })

      if (result.isSignedIn) {
        const user = await getCurrentUser()
        this.state.user = user
        this.state.isAuthenticated = true
      }
    } catch (error: any) {
      this.state.error = this.getErrorMessage(error)
      throw error
    } finally {
      this.state.loading = false
    }
  }

  async signOut(): Promise<void> {
    this.state.loading = true
    this.state.error = null

    try {
      await signOut()
      this.state.user = null
      this.state.isAuthenticated = false
    } catch (error: any) {
      this.state.error = this.getErrorMessage(error)
      throw error
    } finally {
      this.state.loading = false
    }
  }

  getState(): AuthState {
    return { ...this.state }
  }

  private getErrorMessage(error: any): string {
    if (error.name === 'NotAuthorizedException') {
      return '認証に失敗しました。正しいコードを入力してください。'
    }
    if (error.name === 'CodeMismatchException') {
      return '認証コードが正しくありません。'
    }
    if (error.name === 'ExpiredCodeException') {
      return '認証コードの有効期限が切れています。新しいコードを取得してください。'
    }
    if (error.name === 'LimitExceededException') {
      return '試行回数が上限に達しました。しばらく待ってから再度お試しください。'
    }
    if (error.name === 'UserNotFoundException') {
      return 'ユーザーが見つかりません。'
    }
    if (error.name === 'InvalidParameterException') {
      return '入力パラメータが無効です。'
    }
    
    return error.message || '認証中にエラーが発生しました。'
  }
}