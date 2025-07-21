import express from 'express';
import cors from 'cors';
import AWS from 'aws-sdk';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const app = express();
const port = 3001;

// メールコードの一時保存（本番環境ではRedisなど永続化ストレージを使用）
const tempCodes = new Map();

// WebAuthn用のデータ保存（本番環境ではデータベースを使用）
const users = new Map(); // ユーザー情報
const credentials = new Map(); // 認証情報

// ミドルウェア
app.use(cors());
app.use(express.json());

// AWS設定
AWS.config.update({
  region: 'ap-northeast-1',
  // 本番環境では環境変数から設定
  // accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  // secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const ses = new AWS.SES({ region: 'ap-northeast-1' });

// 認証コード送信エンドポイント
app.post('/send-code', async (req, res) => {
  try {
    const { email, temporaryPassword } = req.body;
    
    if (!email || !temporaryPassword) {
      return res.status(400).json({ error: 'Email and temporaryPassword are required' });
    }

    // 6桁のランダムコードを生成
    const authCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 一時的にコードを保存（5分間の有効期限）
    tempCodes.set(email, {
      code: authCode,
      timestamp: Date.now(),
      temporaryPassword: temporaryPassword
    });

    // 5分後にコードを削除
    setTimeout(() => {
      tempCodes.delete(email);
    }, 5 * 60 * 1000);

    // SES設定（本番環境では認証済みドメインを使用）
    const emailParams = {
      Source: 'noreply@yourdomain.com', // 認証済みメールアドレス
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'パスワードレス認証コード',
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: `認証コード: ${authCode}\\n\\nこのコードを認証画面で入力してください。\\n有効期限: 5分`,
            Charset: 'UTF-8'
          },
          Html: {
            Data: `
              <html>
                <body>
                  <h2>パスワードレス認証</h2>
                  <p>認証コード: <strong style="font-size: 24px; color: #1976D2;">${authCode}</strong></p>
                  <p>このコードを認証画面で入力してください。</p>
                  <p><small>有効期限: 5分</small></p>
                </body>
              </html>
            `,
            Charset: 'UTF-8'
          }
        }
      }
    };

    try {
      await ses.sendEmail(emailParams).promise();
      console.log('Email sent successfully to:', email);
      res.json({ success: true, message: 'Code sent successfully' });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // 開発環境では実際のメール送信をスキップ
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Code would be sent to', email, 'Code:', authCode);
        res.json({ success: true, message: 'Code sent successfully (dev mode)', code: authCode });
      } else {
        res.status(500).json({ error: 'Failed to send email' });
      }
    }

  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 認証コード確認エンドポイント
app.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const storedData = tempCodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({ error: 'Code not found or expired' });
    }

    // 5分以内かチェック
    const now = Date.now();
    const timeDiff = now - storedData.timestamp;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeDiff > fiveMinutes) {
      tempCodes.delete(email);
      return res.status(400).json({ error: 'Code expired' });
    }

    // コードが一致するかチェック
    if (storedData.code === code) {
      // 認証成功
      tempCodes.delete(email);
      res.json({ success: true, message: 'Code verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid code' });
    }

  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebAuthn Registration Start
app.post('/webauthn/register-begin', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const userId = new TextEncoder().encode(email);
    const userName = email;
    const userDisplayName = email;

    const options = await generateRegistrationOptions({
      rpName: 'Cognito Passwordless Auth',
      rpID: 'localhost',
      userID: userId,
      userName: userName,
      userDisplayName: userDisplayName,
      attestationType: 'none',
      excludeCredentials: [],
      authenticatorSelection: {
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
    });

    // ユーザー情報を一時保存
    const userIdString = Buffer.from(userId).toString('base64');
    users.set(userIdString, {
      id: userIdString,
      email: email,
      currentChallenge: options.challenge,
    });

    res.json(options);
  } catch (error) {
    console.error('WebAuthn registration begin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebAuthn Registration Complete
app.post('/webauthn/register-complete', async (req, res) => {
  try {
    const { email, credential } = req.body;
    console.log('Registration complete request:', { email, credentialType: typeof credential });
    
    if (!email || !credential) {
      return res.status(400).json({ error: 'Email and credential are required' });
    }

    const userId = new TextEncoder().encode(email);
    const userIdString = Buffer.from(userId).toString('base64');
    const user = users.get(userIdString);
    
    if (!user) {
      console.error('User not found for registration complete:', userIdString);
      return res.status(400).json({ error: 'User not found' });
    }

    console.log('User found, starting verification...');

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: 'http://localhost:8000',
      expectedRPID: 'localhost',
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey } = verification.registrationInfo;
      
      // 認証情報を保存
      const credentialIdBase64 = Buffer.from(credentialID).toString('base64');
      credentials.set(credentialIdBase64, {
        id: credentialID,
        publicKey: credentialPublicKey,
        counter: verification.registrationInfo.counter,
        userId: userIdString,
        email: email,
      });

      res.json({ verified: true, message: 'Registration successful' });
    } else {
      console.error('Registration verification failed:', verification);
      res.status(400).json({ verified: false, error: 'Registration failed' });
    }
  } catch (error) {
    console.error('WebAuthn registration complete error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebAuthn Authentication Start
app.post('/webauthn/auth-begin', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const userId = new TextEncoder().encode(email);
    const userIdString = Buffer.from(userId).toString('base64');
    
    // ユーザーの認証情報を取得
    const userCredentials = Array.from(credentials.values())
      .filter(cred => cred.email === email)
      .map(cred => ({
        id: cred.id,
        type: 'public-key',
      }));

    if (userCredentials.length === 0) {
      return res.status(400).json({ error: 'No credentials found for user' });
    }

    const options = await generateAuthenticationOptions({
      rpID: 'localhost',
      allowCredentials: userCredentials,
      userVerification: 'preferred',
    });

    // チャレンジを保存
    let user = users.get(userIdString);
    if (!user) {
      user = { id: userIdString, email: email };
      users.set(userIdString, user);
    }
    user.currentChallenge = options.challenge;

    res.json(options);
  } catch (error) {
    console.error('WebAuthn authentication begin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebAuthn Authentication Complete
app.post('/webauthn/auth-complete', async (req, res) => {
  try {
    const { email, credential } = req.body;
    
    if (!email || !credential) {
      return res.status(400).json({ error: 'Email and credential are required' });
    }

    const userId = new TextEncoder().encode(email);
    const userIdString = Buffer.from(userId).toString('base64');
    const user = users.get(userIdString);
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    console.log('Looking for credential ID:', credential.id);
    console.log('Available credential keys:', Array.from(credentials.keys()));
    
    // Credential IDをBase64エンコードして照合
    const credentialIdBase64 = Buffer.from(credential.id, 'base64').toString('base64');
    console.log('Credential ID as Base64:', credentialIdBase64);
    
    const storedCredential = credentials.get(credentialIdBase64);
    
    if (!storedCredential) {
      return res.status(400).json({ error: 'Credential not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: 'http://localhost:8000',
      expectedRPID: 'localhost',
      authenticator: {
        credentialID: storedCredential.id,
        credentialPublicKey: storedCredential.publicKey,
        counter: storedCredential.counter,
      },
    });

    if (verification.verified) {
      // カウンターを更新
      storedCredential.counter = verification.authenticationInfo.newCounter;
      
      res.json({ verified: true, message: 'Authentication successful' });
    } else {
      res.status(400).json({ verified: false, error: 'Authentication failed' });
    }
  } catch (error) {
    console.error('WebAuthn authentication complete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// デバッグ用エンドポイント（開発環境のみ）
app.get('/debug/credentials', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const credentialsList = Array.from(credentials.entries()).map(([key, value]) => ({
    key,
    email: value.email,
    userId: value.userId
  }));
  
  res.json({
    users: Array.from(users.keys()),
    credentials: credentialsList,
    totalCredentials: credentials.size
  });
});

// デバッグ用：データクリア（開発環境のみ）
app.delete('/debug/clear', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  users.clear();
  credentials.clear();
  tempCodes.clear();
  
  res.json({ message: 'All data cleared' });
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// サーバー起動
app.listen(port, () => {
  console.log(`Passwordless auth server running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  POST /send-code - Send authentication code');
  console.log('  POST /verify-code - Verify authentication code');
  console.log('  POST /webauthn/register-begin - Start WebAuthn registration');
  console.log('  POST /webauthn/register-complete - Complete WebAuthn registration');
  console.log('  POST /webauthn/auth-begin - Start WebAuthn authentication');
  console.log('  POST /webauthn/auth-complete - Complete WebAuthn authentication');
  console.log('  GET /health - Health check');
});

export default app;