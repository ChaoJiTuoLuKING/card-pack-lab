import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { type DailyRound, type Word } from './rounds';
import chef from './assets/whale-chef.webp';
import type { PackMouth } from './cardFlight';
import { WordCharacter } from './WordCharacter';

type Reading = 'word' | 'example';

function Speaker() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9h4l5-4v14l-5-4H3zM16 8q4 4 0 8m3-11q7 7 0 14" />
    </svg>
  );
}

function EnglishCard({ entry, muted, mouth }: { entry: Word; muted: boolean; mouth: PackMouth }) {
  const card = useRef<HTMLElement>(null);
  const serial = useRef(0);
  const [cue, setCue] = useState(0);
  const [underlined, setUnderlined] = useState(false);
  const example = entry.example ?? '';
  const word = entry.word.toLowerCase();
  const match = Array.from(example.matchAll(/[a-z]+(?:['’-][a-z]+)*/gi)).find(
    (token) => token[0].toLowerCase() === word,
  );
  useLayoutEffect(() => {
    if (!card.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = card.current.getBoundingClientRect();
    const x = mouth.x - rect.left - rect.width / 2;
    const y = mouth.y - rect.top;
    const scale = Math.min(0.76, (mouth.width * 0.8) / rect.width);
    const animation = card.current.animate(
      [
        {
          transform: `translate(${x}px,${y + 4}px) rotate(-7deg) scale(${scale})`,
          clipPath: 'polygon(0 0, 7% 0, 0 6%, 0 6%)',
          offset: 0,
        },
        {
          transform: `translate(${x}px,${y - 32}px) rotate(-5deg) scale(${scale})`,
          clipPath: 'polygon(0 0, 100% 0, 100% 12%, 0 29%)',
          offset: 0.26,
        },
        {
          transform: 'translateY(-8px) rotate(1deg) scale(.98)',
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          offset: 0.76,
        },
        { transform: 'none', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
      ],
      { duration: 690, easing: 'ease-in-out' },
    );
    return () => animation.cancel();
  }, [mouth]);
  const stop = useRef<() => void>(() => {});
  const heading = useRef<HTMLHeadingElement>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    const hide = () => {
      if (document.hidden) {
        stop.current();
        setReading(null);
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      stop.current();
    };
  }, []);
  useEffect(() => {
    if (muted) {
      stop.current();
      setReading(null);
      setError('');
    }
  }, [muted]);

  function play(part: Reading) {
    const text = entry[part];
    if (!text || muted) return;
    stop.current();
    setError('');
    setCue(0);
    setUnderlined(false);
    setReading(part);
    const url = part === 'word' ? entry.audio : entry.exampleAudio;
    let active = true;
    let audio: HTMLAudioElement | undefined;
    let voice: SpeechSynthesisUtterance | undefined;
    const synth = window.speechSynthesis;
    let frame = 0;
    function began() {
      if (!active) return;
      if (part === 'word') setCue(++serial.current);
      else if (match?.index === 0) setUnderlined(true);
    }
    function checkRecording() {
      if (!active || !audio || !match || part !== 'example') return;
      const start = entry.exampleWordStart;
      if (start === undefined) return;
      if (audio.currentTime >= start) setUnderlined(true);
      else frame = requestAnimationFrame(checkRecording);
    }
    stop.current = () => {
      cancelAnimationFrame(frame);
      setUnderlined(false);
      setCue(0);
      active = false;
      audio?.pause();
      if (voice) synth?.cancel();
    };
    function finish(message = '') {
      if (!active) return;
      active = false;
      cancelAnimationFrame(frame);
      setUnderlined(false);
      setReading(null);
      setError(message);
    }
    function speak() {
      if (!active || voice) return;
      cancelAnimationFrame(frame);
      setUnderlined(false);
      if (!synth || !window.SpeechSynthesisUtterance) {
        finish('当前浏览器无法朗读，请检查录音或设备语音。');
        return;
      }
      voice = new SpeechSynthesisUtterance(text);
      const english = synth.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang));
      const preferred =
        english.find((v) => /samantha|google us english|jenny|daniel/i.test(v.name)) ??
        english.find((v) => v.default) ??
        english[0];
      voice.lang = preferred?.lang ?? 'en-US';
      if (preferred) voice.voice = preferred;
      voice.rate = 0.88;
      voice.onstart = began;
      voice.onboundary = (event) => {
        if (active && part === 'example' && match && event.charIndex === match.index)
          setUnderlined(true);
      };
      voice.onend = () => finish();
      voice.onerror = () => finish('朗读失败，请检查设备的英语语音后重试。');
      synth.speak(voice);
    }
    if (url) {
      audio = new Audio(url);
      audio.onplaying = () => {
        if (!active || voice) return;
        began();
        cancelAnimationFrame(frame);
        checkRecording();
      };
      audio.onended = () => finish();
      audio.onerror = speak;
      void audio.play().catch(speak);
    } else speak();
  }
  const readButton = (part: Reading, label: string, content: ReactNode) => (
    <button
      type="button"
      className={'word-play play-' + part}
      disabled={muted}
      data-playing={reading === part}
      onClick={() => play(part)}
      aria-label={label + ' ' + entry[part]}
    >
      <span>{content}</span> <Speaker />
    </button>
  );
  return (
    <article ref={card} className="daily-card listening-card">
      <div className="word-face">
        <div className="word-copy">
          <h2 ref={heading} tabIndex={-1} lang="en" data-long={entry.word.length >= 6 || undefined}>
            {readButton('word', '听单词', entry.word)}
          </h2>
          <p className="word-meaning">{entry.meaning}</p>
        </div>
        <WordCharacter word={word} cue={cue} accent={underlined} />
      </div>
      {entry.example && (
        <div className="word-example">
          <p lang="en">
            {readButton(
              'example',
              '读例句',
              match ? (
                <>
                  {example.slice(0, match.index)}
                  <span className="example-word" data-underlined={underlined}>
                    {match[0]}
                  </span>
                  {example.slice(match.index + match[0].length)}
                </>
              ) : (
                example
              ),
            )}
          </p>
          {entry.translation && <p className="word-translation">{entry.translation}</p>}
        </div>
      )}
      <small className="speech-status" role="status">
        {muted ? '已静音，按 M 开启声音' : error}
      </small>
    </article>
  );
}

export function DailyCard({
  round,
  mouth,
  muted,
  onReset,
}: {
  round: DailyRound;
  mouth: PackMouth;
  muted: boolean;
  onReset: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  if (!round.entry) return null;
  return (
    <section className="daily-result" aria-label="拆包结果">
      {round.theme === 'meal' ? (
        <article className="daily-card">
          <img className="daily-chef" src={chef} alt="" />
          <p className="daily-label">今天就吃</p>
          <h2 ref={heading} tabIndex={-1}>
            {round.entry.name}
          </h2>
          {round.entry.note && <p className="daily-note">{round.entry.note}</p>}
        </article>
      ) : (
        <EnglishCard entry={round.entry} muted={muted} mouth={mouth} />
      )}
      <button
        type="button"
        className={round.theme === 'english' ? 'next-pack' : 'secondary'}
        onClick={onReset}
      >
        {round.theme === 'english' ? '再学一个' : '再拆一包'}
      </button>
    </section>
  );
}
