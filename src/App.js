import { useState } from 'react';
import HundeListe from './pages/HundeListe';
import HundImport from './pages/HundImport';

export default function App() {
  const [seite, setSeite] = useState('liste');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav style={{
        background: '#fff',
        borderBottom: '1.5px solid #f1f5f9',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        height: 56,
        boxShadow: '0 1px 8px rgba(15,23,42,0.06)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <span style={{
          fontWeight: 800,
          fontSize: 16,
          color: '#0f172a',
          marginRight: 24,
          letterSpacing: '-0.02em',
        }}>
          HerdersDB
        </span>

        {[['liste', 'Hunde'], ['import', 'Hund erfassen']].map(([id, label]) => (
          <button key={id} onClick={() => setSeite(id)} style={{
            background: seite === id ? '#6366f1' : 'transparent',
            border: 'none',
            color: seite === id ? '#fff' : '#64748b',
            borderRadius: 8,
            padding: '6px 16px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'all .15s',
            boxShadow: seite === id ? '0 2px 8px rgba(99,102,241,0.28)' : 'none',
          }}>{label}</button>
        ))}
      </nav>

      {seite === 'liste'  && <HundeListe />}
      {seite === 'import' && <HundImport />}
    </div>
  );
}
