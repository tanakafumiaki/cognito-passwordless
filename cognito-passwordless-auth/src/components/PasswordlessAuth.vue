<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-3 pa-6">
          <v-card-title class="text-h4 text-center mb-4">
            <v-icon left class="mr-2">mdi-shield-check</v-icon>
            パスワードレス認証
          </v-card-title>

          <v-card-text>
            <v-form ref="form" v-model="valid">
              <!-- メール送信フェーズ -->
              <div v-if="currentStep === 'email'">
                <v-text-field
                  v-model="email"
                  :rules="emailRules"
                  label="メールアドレス"
                  prepend-icon="mdi-email"
                  type="email"
                  required
                  :disabled="isLoading"
                  @keyup.enter="sendCode"
                />
                <v-btn
                  @click="sendCode"
                  :loading="isLoading"
                  :disabled="!valid || isLoading"
                  color="primary"
                  block
                  class="mt-4"
                >
                  認証コードを送信
                </v-btn>
              </div>

              <!-- コード確認フェーズ -->
              <div v-if="currentStep === 'code'">
                <v-text-field
                  v-model="code"
                  :rules="codeRules"
                  label="認証コード"
                  prepend-icon="mdi-key"
                  type="text"
                  required
                  :disabled="isLoading"
                  @keyup.enter="verifyCode"
                />
                <v-btn
                  @click="verifyCode"
                  :loading="isLoading"
                  :disabled="!code || isLoading"
                  color="primary"
                  block
                  class="mt-4"
                >
                  認証
                </v-btn>
                <v-btn
                  @click="handleGoBack"
                  :disabled="isLoading"
                  color="secondary"
                  block
                  variant="outlined"
                  class="mt-2"
                >
                  戻る
                </v-btn>
              </div>

              <!-- 認証成功フェーズ -->
              <div v-if="currentStep === 'success'">
                <v-alert type="success" class="mb-4">
                  <v-icon slot="prepend">mdi-check-circle</v-icon>
                  認証が完了しました！
                </v-alert>
                <v-btn
                  @click="handleSignOut"
                  color="error"
                  block
                  variant="outlined"
                >
                  サインアウト
                </v-btn>
              </div>
            </v-form>

            <!-- エラーメッセージ -->
            <v-alert v-if="hasError" type="error" class="mt-4">
              {{ errorMessage }}
            </v-alert>

            <!-- 情報メッセージ -->
            <v-alert v-if="info" type="info" class="mt-4">
              {{ info }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePasswordlessAuth } from '../composables/usePasswordlessAuth'

const form = ref()
const valid = ref(false)

const {
  email,
  code,
  currentStep,
  info,
  isLoading,
  isAuthenticated,
  hasError,
  errorMessage,
  currentUser,
  initializeAuth,
  sendPasswordlessCode,
  verifyPasswordlessCode,
  signOut,
  goBack,
  resetError
} = usePasswordlessAuth()

const emailRules = [
  (v: string) => !!v || 'メールアドレスは必須です',
  (v: string) => /.+@.+\..+/.test(v) || '正しいメールアドレスを入力してください',
]

const codeRules = [
  (v: string) => !!v || '認証コードは必須です',
  (v: string) => v.length === 6 || '認証コードは6桁で入力してください',
]

const sendCode = async () => {
  if (!valid.value) return

  try {
    await sendPasswordlessCode(email.value)
  } catch (err: any) {
    // エラーはComposableで処理される
  }
}

const verifyCode = async () => {
  if (!code.value) return

  try {
    await verifyPasswordlessCode(email.value, code.value)
  } catch (err: any) {
    // エラーはComposableで処理される
  }
}

const handleSignOut = async () => {
  try {
    await signOut()
  } catch (err: any) {
    // エラーはComposableで処理される
  }
}

const handleGoBack = () => {
  goBack()
}

// コンポーネントマウント時に認証状態を初期化
onMounted(async () => {
  await initializeAuth()
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>