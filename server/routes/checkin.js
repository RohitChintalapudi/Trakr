const express = require('express');
const router = express.Router();
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Shop target coordinates for verification (centered in Delhi, e.g. [longitude, latitude])
const SHOP_TARGETS = {
  'Reliance Fresh': [77.2090, 28.6139],
  'Horlicks Outlet': [77.2070, 28.6150],
  'Walmart Supercenter': [77.2150, 28.6110],
  'EasyDay Store': [77.2010, 28.6190]
};

// Haversine formula for distance in meters
function getDistance(lon1, lat1, lon2, lat2) {
  const R = 6371e3; // meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

/**
 * @swagger
 * tags:
 *   name: CheckIn
 *   description: Field force check-in management and geopositioning
 */

/**
 * @swagger
 * /api/checkin:
 *   post:
 *     summary: Submit a new salesperson check-in (validates distance for anomaly detection)
 *     tags: [CheckIn]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shopName
 *               - summary
 *               - imageUrl
 *               - coordinates
 *             properties:
 *               shopName:
 *                 type: string
 *                 example: Horlicks Outlet
 *               summary:
 *                 type: string
 *                 example: Restocked Horlicks Lite and checked inventory.
 *               imageUrl:
 *                 type: string
 *                 example: https://via.placeholder.com/150
 *               coordinates:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: "[longitude, latitude] array"
 *                 example: [77.2085, 28.6145]
 *     responses:
 *       201:
 *         description: Check-in successfully recorded
 *       400:
 *         description: Invalid parameters
 */
router.post('/', protect, async (req, res) => {
  try {
    const { shopName, summary, imageUrl, coordinates } = req.body;

    if (!shopName || !summary || !imageUrl || !coordinates || coordinates.length !== 2) {
      return res.status(400).json({ message: 'Invalid check-in details provided' });
    }

    const [lon, lat] = coordinates;

    // Check distance anomaly
    // Use target shop if registered, otherwise fall back to Central Delhi center
    const targetCoords = SHOP_TARGETS[shopName] || [77.2090, 28.6139];
    const targetLon = targetCoords[0];
    const targetLat = targetCoords[1];

    const distance = getDistance(lon, lat, targetLon, targetLat);
    const isAnomaly = distance > 500; // Anomaly if distance is more than 500m

    const checkin = await CheckIn.create({
      salespersonId: req.user._id,
      region: req.user.region, // Inherited from salesperson
      shopName,
      summary,
      imageUrl,
      location: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      isAnomaly,
      distance: Math.round(distance)
    });

    res.status(201).json(checkin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/checkin/my-today:
 *   get:
 *     summary: Retrieve check-ins submitted by the logged-in salesperson today
 *     tags: [CheckIn]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns list of check-ins completed today
 */
router.get('/my-today', protect, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const checkins = await CheckIn.find({
      salespersonId: req.user._id,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ timestamp: -1 });

    res.json(checkins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/checkin/team:
 *   get:
 *     summary: Retrieve check-ins timeline for all descendants in the hierarchy tree
 *     tags: [CheckIn]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns lists of sub-tree check-ins
 */
router.get('/team', protect, async (req, res) => {
  try {
    // Enforce dynamic scoping rules:
    let query = { path: { $regex: `,${req.user._id},` }, _id: { $ne: req.user._id } };
    
    if (req.user.role === 'SuperOfficial') {
      // Super Official sees only checkins inside their region
      query.region = req.user.region;
    } else if (req.user.role === 'Manager') {
      // Manager sees only direct report checkins
      query.parentId = req.user._id;
    }

    const reports = await User.find(query);
    if (reports.length === 0) {
      return res.json([]);
    }

    const reportIds = reports.map((r) => r._id);

    // 2. Fetch check-ins and populate author details
    const checkins = await CheckIn.find({ salespersonId: { $in: reportIds } })
      .populate('salespersonId', 'name email role')
      .sort({ timestamp: -1 });

    res.json(checkins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/checkin/{id}/anomaly:
 *   patch:
 *     summary: Accept or reject a geofence anomaly for a check-in
 *     tags: [CheckIn]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Check-in ID
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
 *                 enum: [Accepted, Rejected]
 *                 example: Accepted
 *     responses:
 *       200:
 *         description: Anomaly status successfully updated
 *       400:
 *         description: Invalid parameters
 *       403:
 *         description: Access denied
 *       404:
 *         description: Check-in not found
 */
router.patch('/:id/anomaly', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Manager' && req.user.role !== 'SuperOfficial' && req.user.role !== 'Owner') {
      return res.status(403).json({ message: 'Access denied: Only managers can resolve anomalies' });
    }

    const { status } = req.body;
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status parameter: must be Accepted or Rejected' });
    }

    const checkin = await CheckIn.findById(req.params.id);
    if (!checkin) {
      return res.status(404).json({ message: 'Check-in entry not found' });
    }

    checkin.anomalyStatus = status;
    await checkin.save();

    res.json(checkin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
