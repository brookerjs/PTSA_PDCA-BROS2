import { useState } from 'react';
import Layout from './components/Layout';
import Register from './pages/Register';
import Settings from './pages/Settings';

export type Page = 'register' | 'settings';

function App() {
  const [page, setPage] = useState<Page>('register');

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'register' && <Register />}
      {page === 'settings' && <Settings />}
    </Layout>
  );
}

export default App;
