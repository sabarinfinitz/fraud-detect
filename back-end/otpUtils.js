require('dotenv').config();
const nodemailer = require('nodemailer');

const otpStore = {};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTP = async (email) => {
  const otp = generateOTP();
  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 min expiry
  };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  await transporter.sendMail({
    from: `"FinVerify OTP" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code',
    html: `<p>Your one-time password (OTP) is: <strong>${otp}</strong></p>`
  });

  console.log(`✅ OTP sent to ${email}: ${otp}`);
};

const verifyOTP = (email, otp) => {
  const record = otpStore[email];
  if (!record || Date.now() > record.expiresAt) return false;
  return record.otp === otp;
};

module.exports = { sendOTP, verifyOTP };
