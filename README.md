# Quick Start Instructions

```txt
$ git clone https://github.com/magiclabs/example-jwt.git
$ cd example-jwt
$ mv .env.local.example .env.local // enter your Magic API keys
$ yarn install
$ yarn dev
```

- View the example code [**here**](https://github.com/magiclabs/example-jwt).
- Try the demo [**here**](https://magic-jwt.vercel.app/login).

# Introduction

When a user logs in with Magic, they'll remain authenticated for 7 days until having to login again. Some developers want to keep their users logged in for much longer, others much shorter (if dealing with sensitive data, such as a finance application). This tutorial will show how you can customize session lengths with Magic, using cookies and JSON web tokens (JWT).

**When relying on Magic to manage sessions, the standard flow is:**

- User logs in with `loginWithMagicLink`
- Send the auth token to your backend to validate
- On the frontend, call `magic.user.isLoggedIn()` to verify the user is authenticated

**This tutorial will take over session management responsibilities from Magic, and the new flow will be:**

- User logs in with `loginWithMagicLink`
- Send the auth token to your backend to validate
- Create a JWT (containing the user info) and set it inside an `httpOnly` cookie
- On the frontend, to verify the user is authenticated, send a request to your own backend at `/api/user` (instead of calling `isLoggedIn()`), a route we'll set up to verify and refresh the cookie & JWT

_Note: even though we’re relying on our backend to tell if the user is logged in, they will still be authenticated with Magic for 7 days after logging in (unless they explicitly logout before then)._

With this approach, you can set the JWT and cookie to expire in 15 minutes, one month, or whatever is best for your app. And after the user logs in, since Magic is no longer relied upon, all we need to do is verify the cookie and JWT to know the user's session is valid.

## What are JSON Web Tokens

JWTs are a token standard that can be used as proof of identity, as well as what permissions a user has. Each JWT has three parts, a `Header`, `Payload`, and `Signature`, separated by a `.`. The `Header` specifies the signing algorithm used to sign the token, the `Payload` contains the data, such as name, email, role, expiration timestamp, etc, and the `Signature` is generated by taking the Header and Payload, and signing it using the algorithm specified in the Header with a `secret` value.

Example JWT:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

Servers issue JWTs to users, and verify them on subsequent requests back to the server. When created, JWTs are signed with a secret that only the issuing server knows, and when verifying the authenticity of the token, the server again uses that secret. If the JWT was altered in any way, when verifying the token, the signature will not match, so the server knows to reject the token.

It's important to note that information **inside** a JWT is not encrypted or secret. For example, anyone can enter a JWT into https://jwt.io to decode and read the contents.

## File Structure

```txt
├── README.md
├── components
│   ├── email-form.js
│   ├── header.js
│   ├── layout.js
│   └── loading.js
├── lib
│   ├── UserContext.js
│   ├── cookies.js
│   ├── magic.js
│   └── magicAdmin.js
├── package.json
├── pages
│   ├── _app.js
│   ├── _document.js
│   ├── api
│   │   ├── login.js
│   │   ├── logout.js
│   │   └── user.js
│   ├── index.js
│   ├── login.js
│   └── profile.js
├── public (images)
├── .env.local
└── yarn.lock
```

# Login

## login.js (Client-side)

After clicking the magic link, `loginWithMagicLink` resolves to an auth token, which is then sent to our backend at `/api/login`. The server will respond with user data, which we set in the `UserContext`.

```js
const Login = () => {
  const [disabled, setDisabled] = useState(false);
  const [user, setUser] = useContext(UserContext);

  // Redirect logged in users to /profile if trying to visit login page
  useEffect(() => {
    user?.issuer && Router.push('/profile');
  }, [user]);

  async function handleLoginWithEmail(email) {
    try {
      setDisabled(true); // disable login button to prevent multiple emails from being triggered

      // Trigger Magic link to be sent to user
      let didToken = await magic.auth.loginWithMagicLink({ email });

      // Validate didToken with server
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + didToken,
        },
      });

      if (res.status === 200) {
        let data = await res.json();
        setUser(data.user);
        Router.push('/profile');
      }
    } catch (error) {
      setDisabled(false); // re-enable login button - user may have requested to edit their email
      console.log(error);
    }
  }

  return; // <LoginForm />
};
```

## /api/login (Server-side)

In our `/api/login` route, we first need to validate the auth token provided by Magic, and then use it to grab information about the user. That information is what will be stored inside the JWT payload, which itself will be stored inside a cookie, and automatically sent to our server on subsequent requests.

Example of the stored cookie:

```js
export default async function login(req, res) {
  try {
    const didToken = req.headers.authorization.substr(7);

    await magic.token.validate(didToken);

    const metadata = await magic.users.getMetadataByToken(didToken);

    // Create JWT with information about the user, expires in `SESSION_LENGTH_IN_DAYS`, and signed by `JWT_SECRET`
    let token = jwt.sign(
      {
        ...metadata,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * process.env.SESSION_LENGTH_IN_DAYS,
      },
      process.env.JWT_SECRET
    );

    // Set a cookie containing the JWT
    setTokenCookie(res, token);

    res.status(200).send({ user: metadata });
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
}
```

# Persisting Login

## Client-side

`_app.js` is a file that initializes all of our pages, and is run when any new page is refreshed. Here, we send a request to our backend at `/api/user` to check if a user is logged in. This backend route simply verifies the cookie and JWT, and refreshes the expiration of each. If `/api/user` responds with no user, redirect the user to `/login`.

```js
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
    <UserContext.Provider value={[user, setUser]}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </UserContext.Provider>
  );
}

export default MyApp;
```

## Validating Cookie and JWT (Backend)

The `/api/user` route will get a request any time a user refreshes the page. It verifies, then refreshes the JWT and cookie, and sends back the logged in user's data to our frontend. The purpose of refreshing the token is so that a user is not logged out after `SESSION_LENGTH_IN_DAYS` days after first logging in, but only logged out after `SESSION_LENGTH_IN_DAYS` days of inactivity.

```js
export default async function user(req, res) {
  try {
    if (!req.cookies.token) return res.json({ user: null });

    let token = req.cookies.token;

    let user = jwt.verify(token, process.env.JWT_SECRET);

    // Refresh JWT
    let newToken = jwt.sign(
      {
        ...user,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * process.env.SESSION_LENGTH_IN_DAYS,
      },
      process.env.JWT_SECRET
    );

    setTokenCookie(res, newToken);

    res.status(200).json({ user });
  } catch (error) {
    res.status(200).json({ user: null });
  }
}
```

## Profile.js

To display information about the user, we rely on the `UserContext`. This is where we stored the user data collected from the response from `/api/user` in `_app.js`.

```js
const Profile = () => {
  const [user] = useContext(UserContext);

  return (
    <>
      {!user || user.loading ? (
        <Loading />
      ) : (
        user.issuer && // <ProfileInfo />
      )}
    </>
  );
};
```

# Logging a User Out

## Logout

_Note: Backing up to when a user logs in with `loginWithMagicLink`, the sdk first checks if the user has an active session with Magic, and if so, automatically logs the user in without having to click any magic link._

To manually log a user out, this will require a request to our backend at `/api/logout` to clear the cookie with the JWT that's being used to prove the user has a valid session.

Even though we are managing the session with the JWT, the session with Magic is still valid for 7 days after first logging in (unless the user logs out before then). Depending on how long ago the user logged in, their session with Magic could still be active. That’s why we need to attempt to log the user out with Magic as well. If the user’s session with Magic is expired, it will throw an error, so this logic is wrapped in a `try / catch` block.

```js
// header.js
<Link href='/api/logout'>
  <TextButton color='warning' size='sm'>
    Logout
  </TextButton>
</Link>
```

```js
// /api/logout
export default async function logout(req, res) {
  try {
    if (!req.cookies.token) return res.status(401).json({ message: 'User is not logged in' });

    let token = req.cookies.token;

    let user = jwt.verify(token, process.env.JWT_SECRET);

    removeTokenCookie(res);

    try {
      await magic.users.logoutByIssuer(user.issuer);
    } catch (error) {
      console.log('Users session with Magic already expired');
    }

    res.writeHead(302, { Location: '/login' });
    res.end();
  } catch (error) {
    res.status(401).json({ message: 'User is not logged in' });
  }
}
```

Again, it's possible that the user is logged in with our app, but has an expired session with Magic. In order for certain Magic SDK methods to work (such as to update their email using [`magic.user.updateEmail`](https://docs.magic.link/client-sdk/web/api-reference#updateemail)), the user must be logged in with Magic. So if needing to call one of these, make sure to prompt the user to login again with `loginWithMagicLink` if their session with Magic has expired.

# Done

You now have a Next.js app with Magic authentication, and custom sessions!
