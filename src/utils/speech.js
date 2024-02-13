export function getBestVoice() {
  const voices = window.speechSynthesis.getVoices();
  // Assume en since the messages haven't been localized
  const bestEnVoices = voices.filter((v) =>
    v.lang.startsWith("en") &&
    (v.name.includes("Google") || v.name.includes("(Natural)"))
  );
  return bestEnVoices.find((v) => v.lang == navigator.language) ||
    bestEnVoices[0];
}

/**
 * @param {SpeechSynthesisUtterance} utterance
 * @param {SpeechSynthesisVoice} [voice]
 */
export function speak(utterance, voice) {
  const mainPromise = new Promise((res, rej) => {
    if (voice) {
      utterance.voice = voice;
      // Chrome on Android won't change the voice if the language on the text
      // is the same. Even then I'm not sure it's actually changing the voice...
      // It also incorrectly sets the lang as "en_US" instead of "en-US".
      utterance.lang = voice.lang.replace('_', '-');
    }
    utterance.onend = res;
    utterance.onerror = rej;
    window.speechSynthesis.speak(utterance);
  });

  return Promise.race([
    mainPromise,
    // Because safari is... how do you say... complete garbage?
    // It sometimes doesn't fire the onend event -_-
    new Promise((res) => setTimeout(res, 3000)),
  ]);
}
