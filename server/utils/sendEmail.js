const { Resend } = require('resend');


const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Se-Docx <noreply@vault.pinch-your-pins.site>';

const sendEmail = async (options) => {
    try {
        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to: options.email,
            subject: options.subject,
            html: options.message
        });

        console.log("Email Sent ID:", data.id);
        return data;
    } catch (error) {
        console.error("Resend Error:", error);
        throw new Error("Email could not be sent");
    }
};

module.exports = sendEmail;