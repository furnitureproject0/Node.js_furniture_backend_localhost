export const generateCompanyEmployeeWelcomeTemplate = ({ name, email, password, role, companyName }) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Welcome to ${companyName}</title>
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
                .role-badge {
                    display: inline-block;
                    background-color: #4CAF50;
                    color: white;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: bold;
                    text-transform: capitalize;
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
                    <h1>Welcome to ${companyName}!</h1>
                    <p>Your account has been created successfully</p>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>You have been added as a <span class="role-badge">${role.replace('_', ' ')}</span> to ${companyName}.</p>
                    
                    <div class="credentials">
                        <h3>Your Login Credentials:</h3>
                        <div class="credential-item">
                            <span class="label">Email:</span> <span class="value">${email}</span>
                        </div>
                        <div class="credential-item">
                            <span class="label">Password:</span> <span class="value">${password}</span>
                        </div>
                        <div class="credential-item">
                            <span class="label">Role:</span> <span class="value">${role.replace('_', ' ')}</span>
                        </div>
                    </div>
                    
                    <div class="warning">
                        <strong>Important:</strong> Please change your password after your first login for security reasons.
                    </div>
                    
                    <p>You can now access your account and start using the platform. If you have any questions, please contact your company administrator.</p>
                </div>
                <div class="footer">
                    <p>Best regards,<br>Team Angebots</p>
                </div>
            </div>
        </body>
        </html>
    `;
};
