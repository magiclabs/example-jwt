import Layout from '../components/layout';
import { UserContext } from '../lib/UserContext';
import { ThemeProvider } from '@magiclabs/ui';
import '@magiclabs/ui/dist/cjs/index.css';
import { useState, useEffect } from 'react';
import Router from 'next/router';

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState();

  // If JWT is valid, set the UserContext with returned value from /api/user
  // Otherwise, redirect to /login and set UserContext to { user: null }
  useEffect(() => {
    setUser({ loading: true });
    fetch('/api/user')
      .then((res) => res.json())
      .then((data) => {
        data.user ? setUser(data.user) : Router.push('/login') && setUser({ user: null });
      });
  }, []);

  return (
    <ThemeProvider root>
      <UserContext.Provider value={[user, setUser]}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </UserContext.Provider>
    </ThemeProvider>
  );
}

export default MyApp;
