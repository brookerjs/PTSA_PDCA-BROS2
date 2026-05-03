import { useState } from 'react';
import Layout from './components/Layout';
import Register from './pages/Register';
import Settings from './pages/Settings';
import BuildNotes from './pages/BuildNotes';
import Admin from './pages/Admin';
import Help from './pages/Help';

export type Page = 'register' | 'build-notes' | 'settings' | 'admin' | 'help';

function App() {
  const [page, setPage] = useState<Page>('register');

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'register' && <Register />}
      {page === 'build-notes' && <BuildNotes />}
      {page === 'settings' && <Settings />}
      {page === 'admin' && <Admin />}
      {page === 'help' && <Help />}
    </Layout>
  );
}

export default App;
