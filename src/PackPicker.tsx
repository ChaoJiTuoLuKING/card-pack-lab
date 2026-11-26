import { useEffect } from 'react';
import snack from './assets/whale-snack.webp';
import headphones from './assets/whale-headphones.webp';
import sheep from './assets/mascot-head.webp';

const modes = [
  { id: 'gold', name: '金光版', art: snack, query: '?pack=whale&effects=gold' },
  {
    id: 'rider',
    name: '稀有卡',
    art: import.meta.env.BASE_URL + 'rider/leap-figure.webp',
    query: '?pack=rider',
  },
  { id: 'english', name: '背单词', art: headphones, query: '?pack=english' },
  { id: 'meadow', name: '小羊', art: sheep, query: '?pack=meadow' },
] as const;

export type NavigatePack = (query: string) => void;

interface Props {
  active: (typeof modes)[number]['id'];
  onNavigate: NavigatePack;
  onToggleSound: () => void;
}

export function PackPicker({ active, onNavigate, onToggleSound }: Props) {
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() === 'm' &&
        !event.repeat &&
        !event.altKey &&
        !event.metaKey &&
        !event.ctrlKey
      )
        onToggleSound();
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [onToggleSound]);

  return (
    <div className="pack-picker" role="group" aria-label="选择卡包玩法">
      {modes.map(({ id, name, art, query }) => (
        <button
          key={id}
          type="button"
          data-mode={id}
          aria-pressed={active === id}
          onClick={() => {
            if (active !== id) onNavigate(query);
          }}
        >
          <span className="picker-portrait">
            <img src={art} alt="" />
          </span>
          {name}
        </button>
      ))}
    </div>
  );
}
