import asyncHandler from 'express-async-handler';
import sendEmail from '../utils/sendEmail.js';

export const testMail = asyncHandler(async (req, res, next) => {
    const email = req.query.email;

    if (!email) {
        return res.status(400).json({
            status: 'error',
            message: 'Email parameter is required'
        });
    }

    await sendEmail({
        to: email,
        subject: 'test',
        html: '<p>This is a test email.</p>'
    });

    res.json({
        status: 'success',
        message: 'Test email sent successfully'
    });
});

