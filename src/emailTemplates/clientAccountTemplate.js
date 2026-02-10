export const generateClientAccountTemplate = ({ name, email, password, companyName }) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Your Account Has Been Created</title>
            <style>
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                }
                .header {
                    background-color: #1976D2;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: white;
                    padding: 30px;
                    border-radius: 0 0 8px 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .credentials {
                    background-color: #f5f5f5;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #1976D2;
                }
                .credential-item {
                    margin: 10px 0;
                    font-family: monospace;
                }
                .label {
                    font-weight: bold;
                    color: #333;
                }
                .value {
                    color: #1976D2;
                    font-size: 16px;
                }
                .warning {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    color: #666;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Your Account Has Been Created</h1>
                    <p>Welcome to Angebots</p>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p><strong>${companyName}</strong> has created an account for you in our system.</p>
                    <p>You can now log in using your email and password:</p>
                    
                    <div class="credentials">
                        <h3>Your Login Credentials:</h3>
                        <div class="credential-item">
                            <span class="label">Email:</span> <span class="value">${email}</span>
                        </div>
                        <div class="credential-item">
                            <span class="label">Password:</span> <span class="value">${password}</span>
                        </div>
                    </div>
                    
                    <div class="warning">
                        <strong>Important:</strong> For security, please log in and change your password as soon as possible.
                    </div>
                    
                    <p>If you have any questions, please contact ${companyName}.</p>
                </div>
                <div class="footer">
                    <p>Best regards,<br>Team Angebots</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

