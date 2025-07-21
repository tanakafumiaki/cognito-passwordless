import './assets/main.css'

import { createApp } from 'vue'
import { Amplify } from 'aws-amplify'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { awsConfig } from './config/aws'

// AWS Amplifyの設定
Amplify.configure(awsConfig)

createApp(App).use(vuetify).mount('#app')
