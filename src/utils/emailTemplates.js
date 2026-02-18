export const generateVerificationEmailTemplate = ({ name, otp }) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email Verification</title>
            <style>
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                }
                .otp {
                    font-size: 32px;
                    font-weight: bold;
                    color: #4CAF50;
                    text-align: center;
                    padding: 20px;
                    margin: 20px 0;
                    background-color: #f5f5f5;
                    border-radius: 5px;
                }
                .note {
                    color: #666;
                    font-size: 14px;
                    text-align: center;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Hello ${name},</h2>
                <p>Thank you for registering with us. Please use the following verification code to verify your email address:</p>
                <div class="otp">${otp}</div>
                <p class="note">This code will expire in 15 minutes.</p>
                <p>If you didn't request this verification, please ignore this email.</p>
                <br>
                <p>Best regards,<br>Team Angebots</p>
            </div>
        </body>
        </html>
    `;
};


export const generateVerificationSuccessTemplate = ({ name }) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email Verified Successfully</title>
            <style>
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                }
                .success {
                    color: #4CAF50;
                    text-align: center;
                    font-size: 24px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Hello ${name},</h2>
                <div class="success">✓ Your email has been verified successfully!</div>
                <p>You can now fully access your account and all its features.</p>
                <p>Thank you for choosing our service.</p>
                <br>
                <p>Best regards,<br>Team Angebots</p>
            </div>
        </body>
        </html>
    `;
};


export const generatePasswordResetEmailTemplate = ({ name, otp }) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Password Reset Code</title>
            <style>
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                }
                .otp {
                    font-size: 32px;
                    font-weight: bold;
                    color: #1976D2;
                    text-align: center;
                    padding: 20px;
                    margin: 20px 0;
                    background-color: #f5f5f5;
                    border-radius: 5px;
                    letter-spacing: 4px;
                }
                .note {
                    color: #666;
                    font-size: 14px;
                    text-align: center;
                    margin-top: 20px;
                }
                .action {
                    margin-top: 16px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Hello ${name || ''},</h2>
                <p>We received a request to reset your password. Use the code below to proceed:</p>
                <div class="otp">${otp}</div>
                <p class="note">This code will expire in 15 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
                <div class="action">
                    <p>For your security, never share this code with anyone.</p>
                </div>
                <br>
                <p>Best regards,<br>Team Angebots</p>
            </div>
        </body>
        </html>
    `;
};

export const sendNewClientAccountCredentialsTemplate = ({ name, email, password }) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Your New Account Credentials</title>
            <style>
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                }
                .credentials {
                    background-color: #f5f5f5;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .credentials p {
                    font-size: 16px;
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Hello ${name},</h2>
                <p>Your account has been created successfully! Here are your login credentials:</p>
                <div class="credentials">
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Password:</strong> ${password}</p>
                </div>
                <p>Please log in to your account and change your password as soon as possible for security reasons.</p>
                <br>
                <p>Best regards,<br>Team Angebots</p>
            </div>
        </body>
        </html>
    `;
};


export const updateClientProfileTemplate = ({ name }) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Profile Updated by Admin</title>
            <style>
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                }
                .notice {
                    color: #2196F3;
                    text-align: center;
                    font-size: 20px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Hello ${name},</h2>
                <div class="notice">Your profile information has been updated by the site/company administrator.</div>
                <p>If you did not expect this change or have any questions, please contact our support team immediately.</p>
                <br>
                <p>Best regards,<br>Team Angebots</p>
            </div>
        </body>
        </html>
    `;
};