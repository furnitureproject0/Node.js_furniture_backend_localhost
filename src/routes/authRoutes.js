import { Router } from "express";
import { register, login, logout, getMe, verifyEmail, resendVerificationCode, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validatin-mw.js';
import { loginSchema, registerSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from "../validation/auth-schema.js";


const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/verify-email', protect, validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', protect, resendVerificationCode);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;
