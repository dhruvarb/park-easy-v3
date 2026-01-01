import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    // Generic SMTP settings. Users can configure these in .env
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'ethereal_user',
        pass: process.env.SMTP_PASS || 'ethereal_pass'
    }
});

export const sendEmail = async ({ to, subject, text }) => {
    console.log(`------------- EMAIL SIMULATION -------------`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log(`--------------------------------------------`);

    if (!process.env.SMTP_HOST) {
        console.log("No SMTP_HOST config found. Email logged to console only.");
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"ParkEasy" <no-reply@parkeasy.com>',
            to,
            subject,
            text,
        });
        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
        // Don't throw error to avoid blocking the user flow in dev mode
    }
};
