import { magic } from '../../lib/magicAdmin';
import { removeTokenCookie } from '../../lib/cookies';
import jwt from 'jsonwebtoken';

/**
 * Clear the cookie with the JWT to log the user out
 * Log the user our of their session with Magic if it's still valid (valid for 7 days after initial login)
 * Redirect the user to /login
 */
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
