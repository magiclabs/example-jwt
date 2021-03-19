import { magic } from '../../lib/magicAdmin';
import jwt from 'jsonwebtoken';
import { setTokenCookie } from '../../lib/cookies';

/**
 * Use Magic to validate the DID token sent in the Autorization header
 * Create JWT containing info about the user
 * Set it inside a cookie, which will be automatically sent on subsequent requests to our server
 * Return the user data to frontend
 */
export default async function login(req, res) {
  try {
    const didToken = req.headers.authorization.substr(7);

    await magic.token.validate(didToken);

    const metadata = await magic.users.getMetadataByToken(didToken);

    let token = jwt.sign(
      {
        ...metadata,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * process.env.SESSION_LENGTH_IN_DAYS,
      },
      process.env.JWT_SECRET
    );

    setTokenCookie(res, token);

    res.status(200).send({ user: metadata });
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
}
