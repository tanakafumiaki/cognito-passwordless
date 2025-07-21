# Cognito Passwordless Authentication (Lambda不要版)

Vue.js + Vuetify + AWS Cognitoを使用したパスワードレス認証システムです。**Lambda関数を使用せず**、Express.jsサーバーを使用してメール送信を行います。

## 機能

- **Lambda不要**: Express.jsサーバーでメール送信を処理
- メールアドレスベースのパスワードレス認証
- **生体認証対応**: WebAuthn APIによる指紋・Face ID認証
- AWS Cognitoの標準的なサインイン/サインアップ機能を使用
- Vuetifyを使用したモダンなUI
- TypeScript対応
- リアクティブな状態管理

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを編集して、AWS Cognitoの設定を行います：

```env
# AWS Cognito設定
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_ZTUENgA4k
VITE_COGNITO_USER_POOL_CLIENT_ID=39t7fpk54bhuv6o279ck5tn0j9
VITE_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
VITE_AWS_REGION=ap-northeast-1

# SES設定（Lambda不要版）
VITE_SES_FROM_EMAIL=noreply@yourdomain.com

# バックエンドAPI設定
VITE_API_ENDPOINT=http://localhost:3001
```

### 3. AWS Cognitoの設定

この方式では**Lambda関数は不要**です。以下の設定のみ行います：

1. **User Pool**の作成
2. **App Client**の作成
3. **Identity Pool**の作成（オプション）

### 4. AWS SESの設定

メール送信のためにAmazon SESの設定が必要です：

1. 送信元メールアドレス/ドメインの認証
2. 必要に応じてSandboxモードの解除
3. IAMユーザーにSES送信権限を付与

## 開発サーバーの起動

### 方法1: 静的HTMLファイルでのテスト（推奨）

```bash
# 1. バックエンドサーバーを起動
NODE_ENV=development npm run server
# または
NODE_ENV=development node server/app.js

# 2. HTTPサーバーを起動（生体認証にはHTTPS/HTTP必須）
python3 -m http.server 8000

# 3. ブラウザでアクセス
# http://localhost:8000/test.html
```

**重要**: 
- **メール認証**: file://でもHTTP経由でも動作
- **生体認証**: HTTP/HTTPSプロトコルが必須（file://では動作しない）
- **推奨アクセス方法**: http://localhost:8000/test.html

**サーバー情報:**
- **バックエンドAPI**: http://localhost:3001
- **フロントエンド**: http://localhost:8000/test.html
- **ヘルスチェック**: http://localhost:3001/health

### 方法2: Viteサーバーでの起動

```bash
# フロントエンドとバックエンドを同時に起動
npm run dev:full

# または個別に起動
npm run dev     # フロントエンド（Vue.js）
npm run server  # バックエンド（Express.js）
```

### 開発サーバーの停止

```bash
# 1. 実行中のサーバーを停止（推奨）
Ctrl+C

# 2. または強制終了
# バックエンドサーバー（ポート3001）を停止
pkill -f "node.*server/app.js"
lsof -ti:3001 | xargs kill -9

# HTTPサーバー（ポート8000）を停止
pkill -f "python.*http.server"
lsof -ti:8000 | xargs kill -9

# 3. ポート使用状況確認
lsof -i :3001  # バックエンドAPI
lsof -i :8000  # HTTPサーバー
```

**注意**: 必ずサーバーを停止してポートを解放してください。

## 使用方法

### アクセス方法
1. ブラウザで **http://localhost:8000/test.html** を開く
2. ランディングページが表示されます

### メール認証
1. **「メール認証でログイン」ボタン**をクリック
2. **メールアドレスを入力**
3. **「認証コードを送信」をクリック**
4. **開発モードでは**コンソールに6桁コードが表示されます
5. **表示されたコードを入力**して「認証」をクリック
6. **ダッシュボード画面**でログイン完了
7. **「サインアウト」**でログアウト

### 生体認証
1. **「生体認証でログイン」ボタン**をクリック
2. **メールアドレスを入力**
3. **「生体認証でログイン」をクリック**
4. **初回**: 自動的に生体認証を設定（指紋・Face ID等）
5. **2回目以降**: 既存の生体認証で自動ログイン
6. **ダッシュボード画面**でログイン完了
7. **「サインアウト」**でログアウト

### 注意事項
- **生体認証**はHTTP/HTTPS環境でのみ動作（http://localhost:8000/test.html）
- **開発モード**では実際のメール送信は行われず、コンソールにコードが表示されます
- **コンソールエラー**（WebAuthn関連）は正常な動作の一部です

## 技術スタック

- **フロントエンド**: Vue.js 3, Vuetify 3, AWS Amplify, TypeScript
- **バックエンド**: Express.js, AWS SES, AWS SDK
- **生体認証**: WebAuthn API, @simplewebauthn/server, @simplewebauthn/browser
- **ビルドツール**: Vite

## システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vue.js App    │───▶│  Express.js     │───▶│   Amazon SES    │
│  (Frontend)     │    │   Server        │    │  (Email送信)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         └─────────────▶│ AWS Cognito     │
                        │ (認証処理)        │
                        └─────────────────┘
```

## ディレクトリ構成

```
├── src/
│   ├── components/
│   │   └── PasswordlessAuth.vue      # メイン認証コンポーネント
│   ├── composables/
│   │   └── usePasswordlessAuth.ts    # 認証状態管理
│   ├── config/
│   │   └── aws.ts                    # AWS設定
│   ├── utils/
│   │   └── passwordless-auth.ts      # 認証サービス
│   └── plugins/
│       └── vuetify.ts                # Vuetifyプラグイン
├── server/
│   └── app.js                        # Express.jsサーバー
├── lambda/                           # Lambda関数（参考用）
└── package.json
```

## API エンドポイント

Express.jsサーバーは以下のエンドポイントを提供します：

- `POST /send-code` - 認証コードをメール送信
- `POST /verify-code` - 認証コードを確認
- `POST /webauthn/register-begin` - WebAuthn登録開始
- `POST /webauthn/register-complete` - WebAuthn登録完了
- `POST /webauthn/auth-begin` - WebAuthn認証開始
- `POST /webauthn/auth-complete` - WebAuthn認証完了
- `GET /health` - ヘルスチェック

## 認証フロー

### 画面遷移
1. **ランディングページ** → メール認証 or 生体認証選択
2. **メール入力画面** → 認証コード送信
3. **コード確認画面** → 認証処理
4. **生体認証画面** → 指紋・Face ID認証
5. **ダッシュボード画面** → ログイン完了

### メール認証の流れ
1. ユーザーがメールアドレスを入力
2. Express.jsサーバーが6桁のコードを生成してSESでメール送信
3. ユーザーが受信したコードを入力
4. Express.jsサーバーがコードを確認
5. 認証成功時、ユーザー情報を表示してダッシュボード画面に遷移

### 生体認証の流れ
1. ユーザーがメールアドレスを入力
2. WebAuthn登録: サーバーがチャレンジを生成、ブラウザが生体認証で秘密鍵を作成
3. WebAuthn認証: サーバーがチャレンジを生成、ブラウザが生体認証で署名
4. サーバーが署名を検証
5. 認証成功時、ユーザー情報を表示してダッシュボード画面に遷移

## 開発モード

開発環境では実際のメール送信をスキップし、コンソールにコードを出力します。

## 本番環境での注意事項

- SESの送信元メールアドレスを実際のドメインに変更
- AWS認証情報を適切に設定
- SESのSandboxモードを解除
- 適切なセキュリティ設定を実装

## Lambda版との違い

| 項目 | Lambda版 | Express.js版 |
|------|----------|-------------|
| 複雑さ | 高 | 低 |
| 設定 | Custom Auth Flow | 標準認証 |
| 運用 | サーバーレス | サーバー必要 |
| コスト | 従量課金 | 固定コスト |

## トラブルシューティング

### メールが送信されない
- SESの送信元メールアドレスが認証されているか確認
- AWS認証情報が正しく設定されているか確認
- SESのSandboxモード制限を確認

### 認証に失敗する
- Cognitoの設定が正しいか確認
- 環境変数が正しく設定されているか確認
- Express.jsサーバーが起動しているか確認

## 開発サーバーの停止

動作確認後は必ず以下のコマンドで停止してください：

```bash
# Ctrl+C を押してサーバーを停止
```

ポートの適切な解放を徹底してください。

## 本番環境での実現方法

### 概要
本番環境では以下の構成で運用します：

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Webサーバー    │───▶│  Express.jsサーバー │───▶│   Amazon SES    │
│  (Nginx/Apache) │    │   (EC2/Docker)  │    │  (メール送信)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         └─────────────▶│ データベース     │
                        │ (RDS/DynamoDB)  │
                        └─────────────────┘
```

### 🔧 AWS SES設定

#### 1. **送信元メールアドレス/ドメインの認証**
- AWS SESコンソールで送信元メールアドレスまたはドメインを認証
- `noreply@yourdomain.com` のような実際のドメインを使用

#### 2. **Sandboxモードの解除**
- デフォルトでは認証済みメールアドレスにのみ送信可能
- 本番環境では「Request production access」を申請してSandboxモードを解除

#### 3. **送信制限の設定**
- 送信レート制限の確認・調整
- 日次送信制限の確認・調整

### 🔐 AWS認証設定

#### 1. **IAMユーザーの作成**
- SES送信専用のIAMユーザーを作成
- 最小限の権限のみ付与（`ses:SendEmail`, `ses:SendRawEmail`）

#### 2. **認証情報の設定**
```bash
# 環境変数での設定
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=ap-northeast-1

# または ~/.aws/credentials ファイルで設定
```

#### 3. **IAMロールの設定（EC2/ECS使用時）**
- インスタンスロールでSES権限を付与
- より安全な認証方法

### 🚀 本番環境設定

#### 1. **サーバー環境**
```bash
# Docker Compose例
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - AWS_ACCESS_KEY_ID=your_key
      - AWS_SECRET_ACCESS_KEY=your_secret
      - SES_FROM_EMAIL=noreply@yourdomain.com
    volumes:
      - ./logs:/app/logs
```

#### 2. **静的ファイル配信**
```nginx
# Nginx設定例
server {
    listen 80;
    server_name yourdomain.com;
    
    # 静的ファイル（test.html等）
    location / {
        root /var/www/html;
        try_files $uri $uri/ =404;
    }
    
    # API プロキシ
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 3. **HTTPS化（必須）**
```bash
# Let's Encrypt使用例
sudo certbot --nginx -d yourdomain.com
```

#### 4. **環境変数設定**
```bash
NODE_ENV=production
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
SES_FROM_EMAIL=noreply@yourdomain.com
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=dbuser
DB_PASS=dbpass
```

#### 5. **セキュリティ対策**
- CORS設定の適切な調整
- レート制限の実装（express-rate-limit）
- Helmet.jsによるセキュリティヘッダー設定

### 📧 メールテンプレート改善

#### 1. **HTMLテンプレートの作成**
- 美しいメールデザインの実装
- 企業ブランディング対応

#### 2. **多言語対応**
- メッセージの国際化
- 地域別設定

### 🗄️ データベース設定

#### 1. **永続化ストレージの実装**
```javascript
// Redis例
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// 認証コード保存（5分間）
await client.setex(`code:${email}`, 300, authCode);

// 生体認証情報保存
await client.hset(`webauthn:${email}`, {
  credentialId: Buffer.from(credentialID).toString('base64'),
  publicKey: Buffer.from(credentialPublicKey).toString('base64')
});
```

#### 2. **PostgreSQL/MySQL例**
```sql
-- 認証コードテーブル
CREATE TABLE auth_codes (
  email VARCHAR(255) PRIMARY KEY,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WebAuthn認証情報テーブル
CREATE TABLE webauthn_credentials (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🔍 監視・ログ設定

#### 1. **ログ記録**
- アクセスログの記録
- エラーログの監視

#### 2. **メトリクス収集**
- 認証成功/失敗率の監視
- SES送信状況の監視

### 🛡️ AWS Cognito本格連携

#### 1. **ユーザー管理**
```javascript
// Cognito SDK v3使用例
import { CognitoIdentityProviderClient, AdminCreateUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({ region: 'ap-northeast-1' });

// ユーザー作成
const createUserCommand = new AdminCreateUserCommand({
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  Username: email,
  MessageAction: 'SUPPRESS',
  TemporaryPassword: Math.random().toString(36)
});
```

#### 2. **実際のトークン発行・検証**
```javascript
// JWT トークン検証
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `https://cognito-idp.ap-northeast-1.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});
```

### 🎯 本番デプロイ手順

#### 1. **AWS EC2/ECS デプロイ**
```bash
# 1. アプリケーションビルド
npm run build

# 2. Docker イメージ作成
docker build -t passwordless-auth .

# 3. ECR プッシュ
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.ap-northeast-1.amazonaws.com
docker tag passwordless-auth:latest your-account.dkr.ecr.ap-northeast-1.amazonaws.com/passwordless-auth:latest
docker push your-account.dkr.ecr.ap-northeast-1.amazonaws.com/passwordless-auth:latest
```

#### 2. **Vercel/Netlify デプロイ**
```bash
# 静的ファイル（test.html）をVercelにデプロイ
vercel --prod

# API サーバーは別途 Railway/Render等にデプロイ
```

これらの設定により、開発モードから本番環境への移行が可能になります。
