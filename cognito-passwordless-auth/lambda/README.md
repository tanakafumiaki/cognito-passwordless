# Cognito Passwordless Authentication Lambda Functions

パスワードレス認証に必要なLambda関数の実装です。

## 必要なLambda関数

### 1. Create Auth Challenge (`create-auth-challenge.js`)
- **トリガー**: Create Auth Challenge
- **役割**: 認証チャレンジ（メール送信）の作成
- **必要な権限**: SES送信権限

### 2. Define Auth Challenge (`define-auth-challenge.js`)
- **トリガー**: Define Auth Challenge
- **役割**: 認証フローの定義と制御

### 3. Verify Auth Challenge Response (`verify-auth-challenge-response.js`)
- **トリガー**: Verify Auth Challenge Response
- **役割**: ユーザーが入力した認証コードの検証

## デプロイ手順

### 1. Lambda関数の作成

各ファイルを個別のLambda関数として作成します：

```bash
# Lambda関数を作成（AWSコンソールまたはAWS CLI）
aws lambda create-function \
    --function-name cognito-create-auth-challenge \
    --runtime nodejs18.x \
    --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://create-auth-challenge.zip
```

### 2. 必要なIAMロール

Lambda関数には以下の権限が必要です：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        }
    ]
}
```

### 3. Cognito User Poolでのトリガー設定

AWS Cognitoコンソールで以下の設定を行います：

1. User Pool `ap-northeast-1_ZTUENgA4k` を開く
2. 「User pool properties」→「Lambda triggers」を選択
3. 以下のトリガーを設定：
   - **Create auth challenge**: `cognito-create-auth-challenge`
   - **Define auth challenge**: `cognito-define-auth-challenge`
   - **Verify auth challenge response**: `cognito-verify-auth-challenge-response`

### 4. SES設定

メール送信のために、Amazon SESで以下の設定が必要です：

1. 送信元メールアドレスの認証
2. 必要に応じてSandboxモードの解除

## 設定例

### Lambda関数の環境変数

```
SES_REGION=ap-northeast-1
FROM_EMAIL=noreply@yourdomain.com
```

### App Client設定

Cognitoアプリクライアントで以下の設定を確認：

- **Auth flows**: `ALLOW_CUSTOM_AUTH`を有効化
- **Prevent User Existence Errors**: 有効化推奨

## テスト

Lambda関数のテストは以下のイベントデータを使用：

### Create Auth Challenge テストイベント
```json
{
    "request": {
        "challengeName": "CUSTOM_CHALLENGE",
        "session": [],
        "userAttributes": {
            "email": "test@example.com"
        }
    },
    "response": {}
}
```

### Define Auth Challenge テストイベント
```json
{
    "request": {
        "session": []
    },
    "response": {}
}
```

### Verify Auth Challenge Response テストイベント
```json
{
    "request": {
        "privateChallengeParameters": {
            "answer": "123456"
        },
        "challengeAnswer": "123456"
    },
    "response": {}
}
```

## 注意事項

- `create-auth-challenge.js`の送信元メールアドレス（`noreply@yourdomain.com`）を実際のドメインに変更してください
- SESのSandboxモードでは認証済みメールアドレスにのみ送信可能です
- 本番環境では適切なエラーハンドリングとログ記録を追加してください