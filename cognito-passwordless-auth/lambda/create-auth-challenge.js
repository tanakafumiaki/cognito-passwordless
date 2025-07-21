const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'ap-northeast-1' });

exports.handler = async (event) => {
    console.log('Create Auth Challenge event:', JSON.stringify(event, null, 2));
    
    if (event.request.challengeName === 'CUSTOM_CHALLENGE') {
        // 6桁のランダムなコードを生成
        const challengeCode = Math.random().toString().slice(2, 8);
        
        // メール送信
        const emailParams = {
            Source: 'noreply@yourdomain.com', // 送信元メールアドレス（SESで認証済みのもの）
            Destination: {
                ToAddresses: [event.request.userAttributes.email]
            },
            Message: {
                Subject: {
                    Data: 'パスワードレス認証コード',
                    Charset: 'UTF-8'
                },
                Body: {
                    Text: {
                        Data: `認証コード: ${challengeCode}\n\nこのコードを認証画面で入力してください。`,
                        Charset: 'UTF-8'
                    },
                    Html: {
                        Data: `
                            <html>
                                <body>
                                    <h2>パスワードレス認証</h2>
                                    <p>認証コード: <strong>${challengeCode}</strong></p>
                                    <p>このコードを認証画面で入力してください。</p>
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
            console.log('Email sent successfully');
            
            event.response.publicChallengeParameters = {
                email: event.request.userAttributes.email
            };
            event.response.privateChallengeParameters = {
                answer: challengeCode
            };
            event.response.challengeMetadata = 'PASSWORDLESS_AUTH';
            
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
    
    return event;
};