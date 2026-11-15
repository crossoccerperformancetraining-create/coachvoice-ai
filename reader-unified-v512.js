(() => {
  'use strict';

  const MODE_KEY = 'coachvoice-audio-mode-v512';
  const POS_KEY = 'coachvoice-audio-position-v512';
  let run = 0;

  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const mode = () => localStorage.getItem(MODE_KEY) || 'gemini';
  const setMode = value => localStorage.setItem(MODE_KEY, value === 'device' ? 'device' : 'gemini');
  const keyFor = text => {
    let hash = 2166136261;
    for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return `cv512:${(hash >>> 0).toString(16)}`;
  };
  const chunks = text => {
    const result = [];
    let current = '';
    for (const sentence of clean(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []) {
      const next = current ? `${current} ${sentence.trim()}` : sentence.trim();
      if (next.length > 2200 && current) { result.push(current); current = sentence.trim(); }
      else current = next;
    }
    if (current) result.push(current);
    return result;
  };
  const native = (text, language, onEnd) => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) throw Error('device_voice_unavailable');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language || 'pt-BR';
    utterance.rate = .92;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  };

  window.cvUnifiedRead = async function(text, options = {}) {
    const full = clean(text);
    if (!full) return;
    const list = chunks(full);
    const id = ++run;
    const box = options.container || document.body;
    let index = Number(localStorage.getItem(POS_KEY + ':' + keyFor(full)) || 0);
    index = Math.max(0, Math.min(index, list.length - 1));
    let stopped = false;
    let playing = false;
    let selected = mode();
    const player = options.player || new Audio();

    const controls = document.createElement('div');
    controls.className = 'cv512-reader-controls';
    controls.innerHTML = `<div class="cv512-reader-buttons">
      <button type="button" data-action="play">▶ Ouvir</button>
      <button type="button" data-action="prev">‹ Anterior</button>
      <button type="button" data-action="next">Próxima ›</button>
      <button type="button" data-action="stop">■ Parar</button>
    </div><label>Voz <select data-action="mode"><option value="gemini">Voz natural</option><option value="device">Voz do aparelho</option></select></label>
    <p data-status role="status">Parte ${index + 1} de ${list.length}. Toque em Ouvir.</p>`;
    box.parentNode?.insertBefore(controls, box.nextSibling);
    const status = controls.querySelector('[data-status]');
    const update = message => { if (status) status.textContent = message || `Parte ${index + 1} de ${list.length}`; };
    const persist = () => localStorage.setItem(POS_KEY + ':' + keyFor(full), String(index));
    const finish = () => { playing = false; persist(); update(index >= list.length - 1 ? 'Leitura concluída.' : `Pausada na parte ${index + 1} de ${list.length}.`); };
    const playPart = () => new Promise((resolve, reject) => {
      if (id !== run || stopped) return resolve();
      update(`Preparando parte ${index + 1} de ${list.length}…`);
      const done = () => { player.onended = null; resolve(); };
      if (selected === 'device') {
        try { native(list[index], options.language || 'pt-BR', done); } catch (error) { reject(error); }
        return;
      }
      if (typeof window.mentor531PlayAudio !== 'function') { reject(Error('gemini_voice_unavailable')); return; }
      window.mentor531PlayAudio(list[index], {
        player, box: controls, language: options.language || 'pt-BR',
        onStatus: update, onEnded: done,
        onBlocked: () => update('Áudio pronto. Toque em ▶ Ouvir para liberar no aparelho.'),
        onError: () => reject(Error('gemini_voice_failed'))
      }).catch(reject);
    });
    const play = async () => {
      if (playing) return;
      playing = true; stopped = false;
      try {
        while (index < list.length && id === run && !stopped) {
          await playPart();
          if (id !== run || stopped) break;
          persist();
          index += 1;
        }
        if (!stopped && index >= list.length) { index = list.length - 1; finish(); }
      } catch (error) {
        playing = false;
        update(selected === 'gemini' ? 'A voz natural falhou. Você pode escolher Voz do aparelho.' : 'Não foi possível reproduzir esta parte.');
        if (selected === 'gemini') controls.querySelector('[data-action="mode"]').focus();
      }
    };
    const stop = () => { stopped = true; playing = false; run += 1; player.pause(); window.mentor531StopAudioPlayback?.(); window.speechSynthesis?.cancel(); update(`Pausada na parte ${index + 1} de ${list.length}.`); };
    controls.querySelector('[data-action="play"]').onclick = play;
    controls.querySelector('[data-action="stop"]').onclick = stop;
    controls.querySelector('[data-action="prev"]').onclick = () => { stop(); index = Math.max(0, index - 1); persist(); update(`Parte ${index + 1} de ${list.length}.`); };
    controls.querySelector('[data-action="next"]').onclick = () => { stop(); index = Math.min(list.length - 1, index + 1); persist(); update(`Parte ${index + 1} de ${list.length}.`); };
    const select = controls.querySelector('[data-action="mode"]'); select.value = selected;
    select.onchange = event => { selected = event.target.value; setMode(selected); stop(); update(`Voz alterada. Parte ${index + 1} de ${list.length}.`); };
    return { stop, parts: list.length };
  };
})();
