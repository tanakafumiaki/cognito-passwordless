exports.handler = async (event) => {
    console.log('Define Auth Challenge event:', JSON.stringify(event, null, 2));
    
    const { request: { session } } = event;
    
    // 最初のリクエストの場合
    if (session.length === 0) {
        event.response.challengeName = 'CUSTOM_CHALLENGE';
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
        return event;
    }
    
    // 前回のチャレンジが成功した場合
    if (session.length === 1 && session[0].challengeResult === true) {
        event.response.issueTokens = true;
        event.response.failAuthentication = false;
        return event;
    }
    
    // 前回のチャレンジが失敗した場合
    if (session.length === 1 && session[0].challengeResult === false) {
        event.response.challengeName = 'CUSTOM_CHALLENGE';
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
        return event;
    }
    
    // 3回失敗した場合は認証失敗
    if (session.length >= 3) {
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
        return event;
    }
    
    // デフォルト: 再チャレンジ
    event.response.challengeName = 'CUSTOM_CHALLENGE';
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    
    return event;
};