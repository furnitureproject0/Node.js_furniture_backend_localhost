import passport from 'passport';
import AppError from '../utils/AppError.js';

export const protect = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        if (err) {
            return next(new AppError('Authentication error', 401));
        }
        if (!user) {
            return next(new AppError('Not authorized to access this route', 401));
        }

        // Allow unverified users to access only verify-email and resend-verification endpoints
        const isVerificationRoute = req.path === '/verify-email' || req.path === '/resend-verification';
        if (!user.is_verified && !isVerificationRoute) {
            return next(new AppError('Please verify your email address to access this route', 403));
        }

        req.user = user;
        next();
    })(req, res, next);
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to access this resource', 403));
        }
        next();
    };
};
