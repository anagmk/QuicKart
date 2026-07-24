import twilio from "twilio";

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

export const sendPhoneOtp = async (phone, otp) => {

    await client.messages.create({

        body: `Your QuickKart OTP is ${otp}`,

        from: process.env.TWILIO_PHONE_NUMBER,

        to: phone

    });

};