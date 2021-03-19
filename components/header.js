import { useContext } from 'react';
import Link from 'next/link';
import { UserContext } from '../lib/UserContext';
import { CallToAction, TextButton } from '@magiclabs/ui';

const Header = () => {
  const [user] = useContext(UserContext);

  return (
    <header>
      <nav>
        <ul>
          {!user || user.loading ? (
            // If loading, don't display any buttons specific to the loggedIn state
            <div style={{ height: '38px' }}></div>
          ) : user.issuer ? (
            <>
              <li>
                <Link href='/'>
                  <TextButton color='primary' size='sm'>
                    Home
                  </TextButton>
                </Link>
              </li>
              <li>
                <Link href='/profile'>
                  <TextButton color='primary' size='sm'>
                    Profile
                  </TextButton>
                </Link>
              </li>
              <li>
                <Link href='/api/logout'>
                  <TextButton color='warning' size='sm'>
                    Logout
                  </TextButton>
                </Link>
              </li>
            </>
          ) : (
            <li>
              <Link href='/login'>
                <CallToAction color='primary' size='sm'>
                  Login
                </CallToAction>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      <style jsx>{`
        nav {
          max-width: 700px;
          margin: 0 auto 50px;
          padding: 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        ul {
          display: flex;
          list-style: none;
        }
        li {
          margin-right: 24px;
          line-height: 38px;
        }
        li:first-child {
          margin-left: auto;
        }
      `}</style>
    </header>
  );
};

export default Header;
