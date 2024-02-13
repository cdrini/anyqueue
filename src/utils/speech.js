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
 * @param {SpeechSynthesisVoice} voice
 */
export function speak(utterance, voice) {
  const mainPromise = new Promise((res, rej) => {
    utterance.voice = voice;
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
