require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendOTP, verifyOTP } = require('./otpUtils');
const authenticateToken = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

const requestIp = require('request-ip');
const geoip = require('geoip-lite');
const LoginLog = require('./models/LoginLog');



app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

const UserSchema = new mongoose.Schema({
  signupData: {
    fullName: String,
    username: String,
    email: String,
    password: String,
    dob: String,
    role: {
      type: String,
      default: 'user', // 'admin' or 'user'
      enum: ['admin', 'user']
    }
  },
  behaviorData: Object
});


const UserBehavior = mongoose.model('UserBehavior', UserSchema);

// ✅ Sign-Up
app.post('/api/signup', async (req, res) => {
  try {
    const { signupData, behaviorData } = req.body;
    const hashedPassword = await bcrypt.hash(signupData.password, 10);

    const role = signupData.email === 'infinverifytz@gmail.com' ? 'admin' : 'user';

    const newUser = new UserBehavior({
      signupData: {
        ...signupData,
        password: hashedPassword,
        role: role
      },
      behaviorData
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});



// ✅ Login Final + JWT

// ✅ Login (final + save login log)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserBehavior.findOne({
      $or: [
        { 'signupData.email': email },
        { 'signupData.username': email }
      ]
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.signupData.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({
      id: user._id,
      email: user.signupData.email,
      username: user.signupData.username,
      role: user.signupData.role     // <-- add this line
    }, process.env.JWT_SECRET, { expiresIn: '2h' });


    // ✅ Get IP & Geo
    const ip = requestIp.getClientIp(req);
    const geo = geoip.lookup(ip);

    // ✅ Save login log
    await LoginLog.create({
      userId: user._id,
      email: user.signupData.email,
      username: user.signupData.username,
      jwtToken: token,
      ipAddress: ip,
      geoLocation: geo || {}
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.signupData.email,
        username: user.signupData.username,
      }
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ✅ Pre-check login for OTP
app.post('/api/login-check', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserBehavior.findOne({
      $or: [
        { 'signupData.email': email },
        { 'signupData.username': email }
      ]
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.signupData.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    await sendOTP(user.signupData.email);
    res.status(200).json({
      message: 'OTP sent after credentials verified',
      verifiedEmail: user.signupData.email
    });
  } catch (err) {
    res.status(500).json({ error: 'Login check error' });
  }
});

// ✅ OTP Send and Verify
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  try {
    await sendOTP(email);
    res.status(200).json({ message: 'OTP sent' });
  } catch {
    res.status(500).json({ error: 'OTP send failed' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const valid = verifyOTP(email, otp);
  if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP' });
  res.status(200).json({ message: 'OTP verified' });
});

// ✅ Protected Route using JWT
app.get('/api/user-profile', authenticateToken, (req, res) => {
  res.json({
    message: 'Protected profile access granted',
    user: req.user
  });
});

// ✅ Admin-only route to get all login logs
app.get('/api/admin/logins', authenticateToken, async (req, res) => {
  try {
    // ✅ Only allow users with role === 'admin'
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const logs = await LoginLog.find().sort({ timestamp: -1 });
    res.status(200).json(logs);

  } catch (err) {
    res.status(500).json({ error: 'Server error fetching login logs' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
