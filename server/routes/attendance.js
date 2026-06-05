const express = require('express');
const router = express.Router();
const AttendanceLog = require('../models/AttendanceLog');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance logging and status tracking
 */

/**
 * @swagger
 * /api/attendance:
 *   post:
 *     summary: Log a new attendance status change
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Active, Break, Hold]
 *                 example: Active
 *               reason:
 *                 type: string
 *                 description: Required if status is Hold
 *                 example: Vehicle Breakdown
 *     responses:
 *       201:
 *         description: Attendance logged successfully
 *       400:
 *         description: Reason required for Hold state
 */
router.post('/', protect, async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (status === 'Hold' && !reason) {
      return res.status(400).json({ message: 'Reason is required for Hold state' });
    }

    const log = await AttendanceLog.create({
      userId: req.user._id,
      status,
      reason: status === 'Hold' ? reason : '',
    });

    res.status(201).json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/attendance/current:
 *   get:
 *     summary: Get current logged-in user's latest attendance status
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns latest attendance status log
 *       404:
 *         description: No attendance log found
 */
router.get('/current', protect, async (req, res) => {
  try {
    const log = await AttendanceLog.findOne({ userId: req.user._id })
      .sort({ timestamp: -1 });
    
    if (!log) {
      // Return a default offline state if none logged
      return res.json({ status: 'Offline', reason: '', timestamp: new Date() });
    }
    res.json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/attendance/team:
 *   get:
 *     summary: Retrieve attendance status ticker for all descendants in the hierarchy tree
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns a list of team members and their latest attendance state
 */
router.get('/team', protect, async (req, res) => {
  try {
    // Enforce dynamic scoping rules:
    let query = { path: { $regex: `,${req.user._id},` }, _id: { $ne: req.user._id } };

    if (req.user.role === 'SuperOfficial') {
      // Super Official sees only nested employees in their assigned region
      query.region = req.user.region;
    } else if (req.user.role === 'Manager') {
      // Branch Manager sees only their direct report salespeople
      query.parentId = req.user._id;
    }

    const reports = await User.find(query);
    if (reports.length === 0) {
      return res.json([]);
    }

    const reportIds = reports.map((r) => r._id);

    // 2. Perform aggregation to find the single latest log for each report user
    const latestLogs = await AttendanceLog.aggregate([
      { $match: { userId: { $in: reportIds } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$userId',
          status: { $first: '$status' },
          reason: { $first: '$reason' },
          timestamp: { $first: '$timestamp' },
        },
      },
    ]);

    // 3. Map logs back to user details for display in the grid
    const ticker = reports.map((user) => {
      const log = latestLogs.find((l) => l._id.toString() === user._id.toString());
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        parentId: user.parentId,
        region: user.region,
        status: log ? log.status : 'Offline', // Fallback to Offline
        reason: log ? log.reason : '',
        timestamp: log ? log.timestamp : null,
      };
    });

    res.json(ticker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
