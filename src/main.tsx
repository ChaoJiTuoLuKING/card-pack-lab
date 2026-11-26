import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { RiderPack } from './RiderPack';
import { RicePack } from './RicePack';
import './stage.css';
import './card.css';
import './pack.css';
import './whale-card.css';
import './whale-stage.css';
import './daily.css';

import './pack-picker.css';

function PackPlayer() {
  const [search, setSearch] = useState(location.search);
  useEffect(() => {
    const sync = () => setSearch(location.search);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  function navigate(query: string) {
    window.history.pushState(null, '', query);
    setSearch(query);
  }

  const pack = new URLSearchParams(search).get('pack');
  if (pack === 'rider') return <RiderPack onNavigate={navigate} />;
  if (pack === 'rice') return <RicePack />;
  return <App key={search} onNavigate={navigate} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PackPlayer />
  </StrictMode>,
);
