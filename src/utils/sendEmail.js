import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    // service: 'gmail',
    // host: "aliweb.ch",
    // port: 465,
    // secure: true, // REQUIRED for port 465

    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // يجب أن تكون true للمنفذ 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const sendEmail = async ({ to, subject, html }) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

export default sendEmail;