const express = require('express');
const router = express.Router();
const multer = require('multer');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Use memory storage so we can convert to base64
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});

// Shop target coordinates for geofence verification [longitude, latitude]
const SHOP_TARGETS = {
  'Reliance Fresh': [77.2090, 28.6139],
  'Horlicks Outlet': [77.2070, 28.6150],
  'Walmart Supercenter': [77.2150, 28.6110],
  'EasyDay Store': [77.2010, 28.6190]
};

// Haversine formula for distance in meters
function getDistance(lon1, lat1, lon2, lat2) {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
 *     summary: Submit a new salesperson check-in
 *     tags: [CheckIn]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               shopName:
 *                 type: string
 *               summary:
 *                 type: string
 *               notes:
 *                 type: string
 *                 description: Alias for summary (Flutter mobile compat)
 *               contactName:
 *                 type: string
 *               outcome:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               coordinates:
 *                 type: string
 *                 description: JSON array "[lon, lat]" (alternative to lat/lon)
 *               imageUrl:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopName:
 *                 type: string
 *               summary:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               coordinates:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       201:
 *         description: Check-in successfully recorded
 *       400:
 *         description: Invalid parameters
 */
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const body = req.body;

    // Normalise field names — Flutter sends 'notes', web sends 'summary'
    const shopName = body.shopName;
    const summary = body.summary || body.notes || '';
    const contactName = body.contactName || '';
    const outcome = body.outcome || 'Interested';
    const address = body.address || '';
    const imageUrl = body.imageUrl || '';

    // Normalise products — Flutter sends products[] repeated fields
    let products = [];
    if (Array.isArray(body['products[]'])) {
      products = body['products[]'];
    } else if (body['products[]']) {
      products = [body['products[]']];
    } else if (Array.isArray(body.products)) {
      products = body.products;
    }

    // Normalise coordinates — Flutter sends latitude/longitude separately,
    // web sends coordinates array [lon, lat]
    let lon, lat;
    if (body.coordinates) {
      // Might be a JSON string or actual array
      const coords = typeof body.coordinates === 'string'
        ? JSON.parse(body.coordinates)
        : body.coordinates;
      [lon, lat] = coords;
    } else {
      lat = parseFloat(body.latitude);
      lon = parseFloat(body.longitude);
    }

    if (!shopName || !summary || isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ message: 'shopName, summary/notes, and coordinates/latitude+longitude are required' });
    }

    // Convert uploaded image file to base64 if provided
    let imageBase64 = '';
    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64');
    }

    // Geofence anomaly check
    const targetCoords = SHOP_TARGETS[shopName] || [77.2090, 28.6139];
    const distance = getDistance(lon, lat, targetCoords[0], targetCoords[1]);
    const isAnomaly = distance > 500;

    const checkin = await CheckIn.create({
      salespersonId: req.user._id,
      region: req.user.region,
      shopName,
      summary,
      contactName,
      outcome,
      products,
      address,
      imageUrl,
      imageBase64,
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
 * /api/checkin/mine:
 *   get:
 *     summary: Retrieve ALL check-ins submitted by the logged-in salesperson (all time)
 *     tags: [CheckIn]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns all check-ins by this salesperson
 */
router.get('/mine', protect, async (req, res) => {
  try {
    const checkins = await CheckIn.find({
      salespersonId: req.user._id
    }).sort({ timestamp: -1 });

    // Map to Flutter-compatible response shape
    const mapped = checkins.map(c => ({
      _id: c._id,
      id: c._id,
      shopName: c.shopName,
      contactName: c.contactName,
      notes: c.summary,
      summary: c.summary,
      outcome: c.outcome,
      products: c.products,
      address: c.address,
      latitude: c.location.coordinates[1],
      longitude: c.location.coordinates[0],
      visitedAt: c.timestamp,
      timestamp: c.timestamp,
      imageUrl: c.imageUrl,
      photoBytesBase64: c.imageBase64 || null,
      isAnomaly: c.isAnomaly,
      distance: c.distance,
    }));

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/checkin/team:
 *   get:
 *     summary: Retrieve check-ins for all descendants in the hierarchy tree
 *     tags: [CheckIn]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns lists of sub-tree check-ins
 */
router.get('/team', protect, async (req, res) => {
  try {
    let query = { path: { $regex: `,${req.user._id},` }, _id: { $ne: req.user._id } };

    if (req.user.role === 'SuperOfficial') {
      query.region = req.user.region;
    } else if (req.user.role === 'Manager') {
      query.parentId = req.user._id;
    }

    const reports = await User.find(query);
    if (reports.length === 0) return res.json([]);

    const reportIds = reports.map((r) => r._id);

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
 *     responses:
 *       200:
 *         description: Anomaly status successfully updated
 */
router.patch('/:id/anomaly', protect, async (req, res) => {
  try {
    if (!['Manager', 'SuperOfficial', 'Owner'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Only managers can resolve anomalies' });
    }

    const { status } = req.body;
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status: must be Accepted or Rejected' });
    }

    const checkin = await CheckIn.findById(req.params.id);
    if (!checkin) return res.status(404).json({ message: 'Check-in not found' });

    checkin.anomalyStatus = status;
    await checkin.save();
    res.json(checkin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
