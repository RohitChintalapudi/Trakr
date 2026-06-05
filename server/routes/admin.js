const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const { protect, checkRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: SuperAdmin system and tenant management operations
 */

/**
 * @swagger
 * /api/admin/companies:
 *   post:
 *     summary: Onboard a new corporate tenant and create its Apex Corporate Owner
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - ownerName
 *               - ownerEmail
 *               - ownerPassword
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: Horlicks
 *               ownerName:
 *                 type: string
 *                 example: Horlicks Owner
 *               ownerEmail:
 *                 type: string
 *                 example: owner@horlicks.com
 *               ownerPassword:
 *                 type: string
 *                 example: horlicks123
 *     responses:
 *       201:
 *         description: Company onboarded successfully
 *       400:
 *         description: Company or Owner already exists
 */
router.post('/companies', protect, checkRole(['Admin']), async (req, res) => {
  try {
    const { companyName, ownerName, ownerEmail, ownerPassword } = req.body;

    const companyExists = await Company.findOne({ name: companyName });
    if (companyExists) {
      return res.status(400).json({ message: 'Company tenant already exists' });
    }

    const userExists = await User.findOne({ email: ownerEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Owner email already registered' });
    }

    // 1. Create company tenant record
    const crypto = require('crypto');
    const apiKey = 'trakr_live_' + crypto.randomBytes(12).toString('hex');

    const company = await Company.create({
      name: companyName,
      subscription: 'Active',
      employeeCount: 1,
      dbHealth: 'Healthy',
      apiKey: apiKey
    });

    // 2. Create Owner user in DB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ownerPassword, salt);
    
    const ownerId = new mongoose.Types.ObjectId();
    const owner = await User.create({
      _id: ownerId,
      name: ownerName,
      email: ownerEmail,
      password: hashedPassword,
      role: 'Owner',
      parentId: null,
      path: `,${ownerId},`
    });

    res.status(201).json({ company, owner });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/admin/companies:
 *   get:
 *     summary: Retrieve list of all onboarded corporate tenants
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns lists of active corporate tenants
 */
router.get('/companies', protect, checkRole(['Admin']), async (req, res) => {
  try {
    const companies = await Company.find({}).sort({ createdAt: -1 });
    res.json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/admin/companies/{id}:
 *   delete:
 *     summary: Delete a company tenant and all its associated personnel
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant deleted successfully
 *       404:
 *         description: Company not found
 */
router.delete('/companies/:id', protect, checkRole(['Admin']), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Find the Owner user (whose name starts with company name)
    const ownerPattern = new RegExp(`^${company.name}`, 'i');
    const owner = await User.findOne({ role: 'Owner', name: ownerPattern });

    if (owner) {
      // Find all nested employees in this owner's sub-tree
      const descendants = await User.find({ path: { $regex: `,${owner._id},` } });
      const descendantIds = descendants.map(d => d._id);
      
      // Delete check-ins, logs, and users in bulk
      await CheckIn.deleteMany({ salespersonId: { $in: descendantIds } });
      await AttendanceLog.deleteMany({ userId: { $in: descendantIds } });
      await User.deleteMany({ _id: { $in: descendantIds } });

      // Clean up the apex Owner logs
      await CheckIn.deleteMany({ salespersonId: owner._id });
      await AttendanceLog.deleteMany({ userId: owner._id });
      await User.deleteOne({ _id: owner._id });
    }

    // Delete company profile
    await Company.deleteOne({ _id: company._id });

    res.json({ message: 'Tenant company and all associated records deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/admin/system-stats:
 *   get:
 *     summary: Retrieve system performance metrics and access logs
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns metrics and access logs
 */
router.get('/system-stats', protect, checkRole(['Admin']), async (req, res) => {
  try {
    // Generate realistic, fluctuating mock stats
    const stats = {
      cpuUsage: Math.floor(Math.random() * 20) + 10, // 10-30%
      memoryUsage: Math.floor(Math.random() * 15) + 40, // 40-55%
      apiThresholds: {
        currentCalls: Math.floor(Math.random() * 300) + 700,
        maxLimit: 5000,
        rateLimitState: 'Normal'
      },
      accessLogs: [
        { id: 1, timestamp: new Date(Date.now() - 1000 * 30).toISOString(), ip: '192.168.1.1', endpoint: 'POST /api/auth/login', status: 200 },
        { id: 2, timestamp: new Date(Date.now() - 1000 * 90).toISOString(), ip: '192.168.1.5', endpoint: 'GET /api/attendance/team', status: 200 },
        { id: 3, timestamp: new Date(Date.now() - 1000 * 180).toISOString(), ip: '192.168.1.10', endpoint: 'POST /api/checkin', status: 201 },
        { id: 4, timestamp: new Date(Date.now() - 1000 * 250).toISOString(), ip: '192.168.1.15', endpoint: 'GET /api/admin/companies', status: 200 },
        { id: 5, timestamp: new Date(Date.now() - 1000 * 400).toISOString(), ip: '192.168.1.1', endpoint: 'POST /api/attendance', status: 201 }
      ]
    };
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
