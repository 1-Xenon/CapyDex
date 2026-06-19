import React, { useState } from 'react';
import Catalog from './pages/Catalog.jsx';
import Changelog from './pages/Changelog.jsx';

export default function App() {
  const [tab, setTab] = useState('index');

  return (
    <>
      <header className="app-header public-index-header">
        <div>
          <strong>Capybara Go Index</strong>
          <span>Updated as of v1.8.17</span>
        </div>
        <nav className="public-index-tabs" aria-label="Primary">
          <button type="button" className={tab === 'index' ? 'active' : ''} onClick={() => setTab('index')}>Index</button>
          <button type="button" className={tab === 'changelog' ? 'active' : ''} onClick={() => setTab('changelog')}>Changelog</button>
        </nav>
      </header>
      {tab === 'index' ? <Catalog /> : <Changelog />}
      <footer className="public-index-footer">
        Unofficial community project. Not affiliated with Habby. Game information may change between versions.
      </footer>
    </>
  );
}
