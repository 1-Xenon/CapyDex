import React, { useEffect, useState } from 'react';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Changelog from './pages/Changelog.jsx';

function basePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

function pageFromPath() {
  if (typeof window === 'undefined') return 'home';

  const base = basePath();
  let pathname = window.location.pathname;
  if (base && pathname.startsWith(base)) {
    pathname = pathname.slice(base.length) || '/';
  }

  if (pathname === '/changelog') return 'changelog';
  if (pathname === '/index' || /^\/[^/=]+=[^/]+$/.test(pathname) || window.location.search) return 'index';
  return 'home';
}

function pagePath(page) {
  if (page === 'index') return `${basePath()}/index`;
  if (page === 'changelog') return `${basePath()}/changelog`;
  return `${basePath()}/`;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'index', label: 'Index' },
  { id: 'changelog', label: 'Changelog' },
];

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
      window.scrollTo({ top: 0 });
    }
  }

  let page = <Home onNavigate={changeTab} />;
  if (tab === 'index') page = <Catalog />;
  if (tab === 'changelog') page = <Changelog />;

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <button type="button" className="site-brand" onClick={() => changeTab('home')} aria-label="CapyDex home">
            <span className="site-brand-mark" aria-hidden="true">C</span>
            <span className="site-brand-copy">
              <strong>CapyDex</strong>
            </span>
          </button>
          <nav className="site-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <button
                type="button"
                className={`site-nav-button${tab === item.id ? ' active' : ''}`}
                aria-current={tab === item.id ? 'page' : undefined}
                key={item.id}
                onClick={() => changeTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <span className="version-badge"><i />v1.8.19</span>
        </div>
      </header>
      {page}
      <footer className="public-index-footer">
        <div className="footer-brand">
          <span className="site-brand-mark" aria-hidden="true">C</span>
          <div><strong>CapyDex</strong><span>A community field guide for Capybara Go.</span></div>
        </div>
        <p>Unofficial community project. Not affiliated with Habby. Game information may change between versions.</p>
      </footer>
    </>
  );
}
