const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { protect } = require('../middleware/auth');

// Helper to sign JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey', {
    expiresIn: '30d',
  });
};

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration, login, and profile operations
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user into the hierarchy
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [Admin, Owner, SuperOfficial, Manager, Salesperson]
 *                 example: Salesperson
 *               parentId:
 *                 type: string
 *                 description: ID of the parent manager in the hierarchy
 *                 example: 60d21b4667d0d8992e61358f
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists or invalid data
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, parentId, region } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a temporary User instance to get an ID for path construction
    const newUserId = new mongoose.Types.ObjectId();

    let calculatedPath = `,${newUserId},`;
    let finalRegion = region || 'Global';

    if (parentId) {
      const parentUser = await User.findById(parentId);
      if (!parentUser) {
        return res.status(400).json({ message: 'Parent user not found' });
      }
      calculatedPath = `${parentUser.path}${newUserId},`;
      finalRegion = region || parentUser.region;
    }

    const user = await User.create({
      _id: newUserId,
      name,
      email,
      password: hashedPassword,
      role,
      parentId: parentId || null,
      path: calculatedPath,
      region: finalRegion
    });

    // If an Owner is registered, we increment employee counts or create sample company metrics if needed
    if (role === 'Owner') {
      const companyName = name + ' Group';
      const crypto = require('crypto');
      const apiKey = 'trakr_live_' + crypto.randomBytes(12).toString('hex');
      
      await Company.findOneAndUpdate(
        { name: companyName },
        { 
          $setOnInsert: { apiKey: apiKey },
          $set: { subscription: 'Active', employeeCount: 1 } 
        },
        { upsert: true, new: true }
      );
    } else if (parentId) {
      // Find the apex Owner in path to increment employee counts
      // Path is e.g. ,OwnerId,SuperOfficialId,ManagerId,
      const ids = user.path.split(',').filter(Boolean);
      if (ids.length > 0) {
        const ownerId = ids[0];
        const owner = await User.findById(ownerId);
        if (owner) {
          const companyName = owner.name + ' Group';
          await Company.findOneAndUpdate(
            { name: companyName },
            { $inc: { employeeCount: 1 } }
          );
        }
      }
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      parentId: user.parentId,
      path: user.path,
      region: user.region,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const mongoose = require('mongoose');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user and return a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: owner@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        parentId: user.parentId,
        path: user.path,
        region: user.region,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get details of the currently logged in user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns details of the logged in user
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
