import { signIn, signUp, confirmSignUp, signOut, getCurrentUser } from 'aws-amplify/auth'
import type { AuthUser } from 'aws-amplify/auth'

export interface PasswordlessAuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export class PasswordlessAuthService {
  private static instance: PasswordlessAuthService
  private state: PasswordlessAuthState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  }
  
  private temporaryPasswords: Map<string, string> = new Map()

  static getInstance(): PasswordlessAuthService {
    if (!PasswordlessAuthService.instance) {
      PasswordlessAuthService.instance = new PasswordlessAuthService()
    }
    return PasswordlessAuthService.instance
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

  async sendPasswordlessCode(email: string): Promise<void> {
    this.state.loading = true
    this.state.error = null

    try {
      // 6桁のランダムなコードを生成
      const temporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
      this.temporaryPasswords.set(email, temporaryPassword)

      // バックエンドAPIに送信リクエスト
      const response = await fetch(`${process.env.VITE_API_ENDPOINT}/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          temporaryPassword
        })
      })

      if (!response.ok) {
        throw new Error('コードの送信に失敗しました')
      }

      // ユーザーが存在しない場合は作成
      try {
        await signUp({
          username: email,
          password: temporaryPassword,
          options: {
            userAttributes: {
              email: email,
            },
            autoSignIn: {
              enabled: true,
            },
          },
        })
      } catch (signUpError: any) {
        if (signUpError.name === 'UsernameExistsException') {
          // ユーザーが既に存在する場合は何もしない
          console.log('User already exists')
        } else {
          throw signUpError
        }
      }

    } catch (error: any) {
      this.state.error = this.getErrorMessage(error)
      throw error
    } finally {
      this.state.loading = false
    }
  }

  async verifyPasswordlessCode(email: string, code: string): Promise<void> {
    this.state.loading = true
    this.state.error = null

    try {
      const temporaryPassword = this.temporaryPasswords.get(email)
      
      if (!temporaryPassword) {
        throw new Error('一時パスワードが見つかりません。最初からやり直してください。')
      }

      // バックエンドAPIでコードを確認
      const response = await fetch(`${process.env.VITE_API_ENDPOINT}/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code
        })
      })

      if (!response.ok) {
        throw new Error('認証コードが正しくありません')
      }

      // Cognitoでサインイン
      const result = await signIn({
        username: email,
        password: temporaryPassword,
      })

      if (result.isSignedIn) {
        const user = await getCurrentUser()
        this.state.user = user
        this.state.isAuthenticated = true
        
        // 一時パスワードをクリア
        this.temporaryPasswords.delete(email)
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
      this.temporaryPasswords.clear()
    } catch (error: any) {
      this.state.error = this.getErrorMessage(error)
      throw error
    } finally {
      this.state.loading = false
    }
  }

  getState(): PasswordlessAuthState {
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