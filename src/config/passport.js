import passport from 'passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
import User from '../models/user.js';

const cookieExtractor = (req) => {
    let token = null;

    // First try to get token from cookies
    if (req && req.cookies) {
        token = req.cookies['accessToken'];
    }

    // If not found in cookies, try to get from Authorization header
    if (!token && req && req.headers && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
        } else {
            token = authHeader; // If no Bearer prefix, use the whole value
        }
    }

    return token;
};

const options = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET,
};

passport.use(
    new JwtStrategy(options, async (payload, done) => {
        try {
            const user = await User.findByPk(payload.id);

            if (user) {
                return done(null, user);
            }

            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

export default passport;