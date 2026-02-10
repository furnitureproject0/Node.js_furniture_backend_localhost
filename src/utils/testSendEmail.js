import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// import sendEmail from './sendEmail.js';

// Load environment variables from the root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const runTest = async () => {
    // Dynamic import to ensure env vars are loaded before sendEmail.js works
    const sendEmail = (await import('./sendEmail.js')).default;

    console.log('Testing sendEmail function...');
    console.log('\n--- Configuration Check ---');
    
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;
    const from = process.env.EMAIL_FROM;

    console.log(`EMAIL_USER: ${user ? user : 'MISSING'}`);
    console.log(`EMAIL_APP_PASSWORD: ${pass ? (pass.length > 0 ? 'SET (length: ' + pass.length + ')' : 'EMPTY STRING') : 'MISSING'}`);
    console.log(`EMAIL_FROM: ${from ? from : 'MISSING (will use EMAIL_USER or fail)'}`);

    if (!user || !pass) {
        console.error('\n❌ Critical Error: EMAIL_USER or EMAIL_APP_PASSWORD environment variables are missing in .env');
        console.log('Please ensure your .env file in the project root contains these variables.');
        return;
    }

    if (!from) {
        console.warn('\n⚠️ Warning: EMAIL_FROM is not set in .env. Some email providers may reject the email or use a default.');
    }

    console.log('\n--- Sending Email ---');
    try {
        const testOptions = {
            to: 'herot7815@gmail.com', // Send to specified test email
            subject: 'Test Email from Furniture Backend',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h1 style="color: #333;">Test Email</h1>
                    <p>This is a test email to verify the sendEmail functionality.</p>
                    <p><strong>Time sent:</strong> ${new Date().toLocaleString()}</p>
                    <hr>
                    <p style="font-size: 12px; color: #666;">If you received this, the email configuration is correct.</p>
                </div>
            `
        };

        console.log(`Attempting to send email to: ${testOptions.to}`);
        const result = await sendEmail(testOptions);
        console.log('\n✅ Email sent successfully!');
        console.log('Response:', result);
    } catch (error) {
        console.error('\n❌ Failed to send email.');
        console.error('Error details:', error);
        
        if (error.code === 'EAUTH') {
            console.log('\n--- Troubleshooting Tips ---');
            console.log('1. Check if EMAIL_USER and EMAIL_APP_PASSWORD are correct.');
            console.log('2. If using Gmail:');
            console.log('   - Are you using an App Password? (Required if 2FA is on)');
            console.log('   - The password in .env looks short/complex/unusual? usage of special chars?');
        }
    }
};

runTest();
