import { ref, reactive, computed } from 'vue'
import { PasswordlessAuthService } from '../utils/passwordless-auth'

const authService = PasswordlessAuthService.getInstance()

export const usePasswordlessAuth = () => {
  const state = reactive({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  })

  const email = ref('')
  const code = ref('')
  const currentStep = ref<'email' | 'code' | 'success'>('email')
  const info = ref('')

  const updateState = () => {
    const authState = authService.getState()
    state.user = authState.user
    state.isAuthenticated = authState.isAuthenticated
    state.loading = authState.loading
    state.error = authState.error
  }

  const initializeAuth = async () => {
    await authService.initializeAuth()
    updateState()
    
    if (state.isAuthenticated) {
      currentStep.value = 'success'
    }
  }

  const sendPasswordlessCode = async (emailAddress: string) => {
    try {
      resetError()
      info.value = ''
      
      await authService.sendPasswordlessCode(emailAddress)
      currentStep.value = 'code'
      info.value = `${emailAddress} に認証コードを送信しました`
      updateState()
    } catch (error) {
      updateState()
      throw error
    }
  }

  const verifyPasswordlessCode = async (emailAddress: string, authCode: string) => {
    try {
      resetError()
      info.value = ''
      
      await authService.verifyPasswordlessCode(emailAddress, authCode)
      currentStep.value = 'success'
      info.value = '認証が完了しました'
      updateState()
    } catch (error) {
      updateState()
      throw error
    }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
      currentStep.value = 'email'
      email.value = ''
      code.value = ''
      info.value = ''
      updateState()
    } catch (error) {
      updateState()
      throw error
    }
  }

  const goBack = () => {
    currentStep.value = 'email'
    code.value = ''
    info.value = ''
    resetError()
  }

  const resetError = () => {
    state.error = null
  }

  // 算出プロパティ
  const isLoading = computed(() => state.loading)
  const isAuthenticated = computed(() => state.isAuthenticated)
  const hasError = computed(() => !!state.error)
  const errorMessage = computed(() => state.error)
  const currentUser = computed(() => state.user)

  return {
    // リアクティブな状態
    state,
    email,
    code,
    currentStep,
    info,
    
    // 算出プロパティ
    isLoading,
    isAuthenticated,
    hasError,
    errorMessage,
    currentUser,
    
    // メソッド
    initializeAuth,
    sendPasswordlessCode,
    verifyPasswordlessCode,
    signOut,
    goBack,
    resetError
  }
}