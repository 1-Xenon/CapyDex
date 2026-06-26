import React, { useEffect, useState } from 'react';
import Catalog from './pages/Catalog.jsx';
import Changelog from './pages/Changelog.jsx';

function basePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

function pageFromPath() {
  if (typeof window === 'undefined') return 'index';

  const base = basePath();
  let pathname = window.location.pathname;
  if (base && pathname.startsWith(base)) {
    pathname = pathname.slice(base.length) || '/';
  }

  return pathname === '/changelog' ? 'changelog' : 'index';
}

function pagePath(page) {
  return `${basePath()}/${page === 'changelog' ? 'changelog' : ''}`;
}

export default function App() {
  const [tab, setTab] = useState(() => pageFromPath());

  useEffect(() => {
    function syncTabFromPath() {
      setTab(pageFromPath());
    }

    window.addEventListener('popstate', syncTabFromPath);
    return () => window.removeEventListener('popstate', syncTabFromPath);
  }, []);

  function changeTab(nextTab) {
    setTab(nextTab);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', pagePath(nextTab));
    }
  }

  return (
    <>
      <header className="app-header public-index-header">
        <div>
          <strong>CapyDex - The Holy Grail </strong>
          <span>Updated as of v1.8.18</span>
        </div>
        <nav className="public-index-tabs" aria-label="Primary">
          <button type="button" className={tab === 'index' ? 'active' : ''} onClick={() => changeTab('index')}>Index</button>
          <button type="button" className={tab === 'changelog' ? 'active' : ''} onClick={() => changeTab('changelog')}>Changelog</button>
        </nav>
      </header>
      {tab === 'index' ? <Catalog /> : <Changelog />}
      <footer className="public-index-footer">
        Unofficial community project. Not affiliated with Habby. Game information may change between versions.
      </footer>
    </>
  );
}
