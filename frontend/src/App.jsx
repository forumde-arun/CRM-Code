import { useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Connection from './pages/Connection.jsx';
import Templates from './pages/Templates.jsx';
import Contacts from './pages/Contacts.jsx';
import Campaigns from './pages/Campaigns.jsx';

const links = [['connection', 'Connection'], ['templates', 'Templates'], ['contacts', 'Contacts'], ['campaigns', 'Campaigns']];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const login = (t) => { localStorage.setItem('token', t); setToken(t); };
  const logout = () => { localStorage.removeItem('token'); setToken(null); };
  if (!token) return <Login onLogin={login} />;
  return (
    <div className="shell">
      <nav>
        <b>FlowWA</b>
        {links.map(([p, l]) => <NavLink key={p} to={'/' + p}>{l}</NavLink>)}
        <button className="link" onClick={logout}>Sign out</button>
      </nav>
      <main>
        <Routes>
          <Route path="/connection" element={<Connection />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="*" element={<Navigate to="/connection" replace />} />
        </Routes>
      </main>
    </div>
  );
}
