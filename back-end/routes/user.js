// backend/routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Registration endpoint
router.post('/register', async (req, res) => {
  const { username, email } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'Username already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      fingerprintTemplate: "", // empty initially
      behavioralProfile: {},
    });

    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
