import { ref, reactive, computed } from 'vue'
import { AuthService } from '../utils/auth'

const authService = AuthService.getInstance()

export const useAuth = () => {
  const state = reactive({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  })

  const email = ref('')
  const code = ref('')
  const currentStep = ref<'email' | 'code' | 'success'>('email')

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

  const sendAuthCode = async (emailAddress: string) => {
    try {
      await authService.sendAuthCode(emailAddress)
      currentStep.value = 'code'
      updateState()
    } catch (error) {
      updateState()
      throw error
    }
  }

  const verifyAuthCode = async (authCode: string) => {
    try {
      await authService.verifyAuthCode(authCode)
      currentStep.value = 'success'
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
      updateState()
    } catch (error) {
      updateState()
      throw error
    }
  }

  const goBack = () => {
    currentStep.value = 'email'
    code.value = ''
    state.error = null
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
    
    // 算出プロパティ
    isLoading,
    isAuthenticated,
    hasError,
    errorMessage,
    currentUser,
    
    // メソッド
    initializeAuth,
    sendAuthCode,
    verifyAuthCode,
    signOut,
    goBack,
    resetError
  }
}