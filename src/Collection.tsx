import { useEffect, useRef, useState } from 'react';
import { collectionId, finishes, themes, type PackTheme, type Pull } from './cards';
import { FoilCard } from './FoilCard';

export function Collection({
  theme,
  found,
  ownedCount,
  onClose,
}: {
  theme: PackTheme;
  found: Set<string>;
  ownedCount: number;
  onClose: () => void;
}) {
  const catalog = themes[theme];
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Pull | null>(null);
  const previous = useRef<string | null>(null);
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    return () => el.close();
  }, []);
  useEffect(() => {
    if (selected) back.current?.focus();
    else if (previous.current)
      dialog.current
        ?.querySelector<HTMLButtonElement>(`[data-print="${previous.current}"]`)
        ?.focus();
  }, [selected]);
  function close() {
    if (selected) setSelected(null);
    else onClose();
  }
  return (
    <dialog
      ref={dialog}
      className="collection"
      aria-labelledby="collection-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="album-page">
        <header>
          <div>
            <h2 id="collection-title">
              {selected
                ? theme === 'whale'
                  ? selected.card.title
                  : selected.card.sheep
                : catalog.album}
            </h2>
            <p id="album-hint">
              {selected
                ? `${finishes[selected.finish].name}版 · ${selected.card.hint ?? '移动或轻划卡面看反光'}`
                : `已收藏 ${ownedCount} / ${catalog.prints.length} 款`}
            </p>
          </div>
          <button ref={back} className="secondary" onClick={close}>
            {selected ? '返回收藏册' : '关闭'}
          </button>
        </header>
        {selected ? (
          <ul className="album-inspect">
            <FoilCard
              card={selected.card}
              finish={selected.finish}
              position={0}
              active
              canFlip={false}
              revealed
              onHover={() => {}}
              onReveal={() => {}}
            />
          </ul>
        ) : (
          <div className="album-grid">
            {catalog.cards.map((card) => {
              const prints = catalog.prints.filter((p) => p.card === card);
              const label = theme === 'whale' ? card.title : card.sheep;
              return (
                <section key={card.id}>
                  <h3>{label}</h3>
                  {prints.map((p) => {
                    const id = collectionId(p),
                      owned = found.has(id);
                    return (
                      <button
                        key={id}
                        data-print={id}
                        data-finish={p.finish}
                        className="album-print"
                        type="button"
                        disabled={theme === 'meadow' && !owned}
                        aria-label={`${label} · ${finishes[p.finish].name} · ${owned ? '查看卡面' : theme === 'whale' ? '预览卡面' : '未收录'}`}
                        onClick={() => {
                          previous.current = id;
                          setSelected(p);
                        }}
                      >
                        {owned || theme === 'whale' ? (
                          <img src={card.art} alt="" />
                        ) : (
                          <span className="missing-print" aria-hidden="true">
                            ◇
                          </span>
                        )}
                        <span>{finishes[p.finish].name}</span>
                      </button>
                    );
                  })}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </dialog>
  );
}
