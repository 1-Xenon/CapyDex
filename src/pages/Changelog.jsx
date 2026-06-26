import React from 'react';

const UPDATES = [
  {
    date: '2026-06-26',
    title: 'Added 1 new brand',
    changes: [
      "Added Ootengu",
    ]
  },
  {
    date: '2026-06-24',
    title: 'Improvements on UI/UX',
    changes: [
      "Added colours based on rarity to the cards for items with rarities tagged to them",
    ]
  },
  {
    date: '2026-06-16',
    title: 'Creation of site',
    changes: [
    ]
  },
];

export default function Changelog() {
  return (
    <main>
      <div className="page-header">
        <div>
          <h1>Changelog</h1>
        </div>
        <span className="pill">{UPDATES.length} updates</span>
      </div>

      <section className="changelog-list" aria-label="Index changelog">
        {UPDATES.map((entry) => (
          <article className="changelog-entry" key={`${entry.date}_${entry.title}`}>
            <div className="changelog-date">{entry.date}</div>
            <div>
              <h2>{entry.title}</h2>
              <ul>
                {entry.changes.map((change) => <li key={change}>{change}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
