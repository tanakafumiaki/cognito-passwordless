exports.handler = async (event) => {
    console.log('Verify Auth Challenge Response event:', JSON.stringify(event, null, 2));
    
    const expectedAnswer = event.request.privateChallengeParameters.answer;
    const challengeAnswer = event.request.challengeAnswer;
    
    console.log('Expected answer:', expectedAnswer);
    console.log('Challenge answer:', challengeAnswer);
    
    // 答えが一致するかチェック
    if (challengeAnswer === expectedAnswer) {
        event.response.answerCorrect = true;
        console.log('Challenge answer is correct');
    } else {
        event.response.answerCorrect = false;
        console.log('Challenge answer is incorrect');
    }
    
    return event;
};