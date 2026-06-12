const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
const swaggerSpecs = require('./config/swagger');
const seedDatabase = require('./utils/seed');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Core Middleware — allow large payloads for base64 image uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to Database
connectDB().then(() => {
  seedDatabase();
});

// Mount Routes
const checkinRouter = require('./routes/checkin');
const attendanceRouter = require('./routes/attendance');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/attendance', attendanceRouter);
// Alias: Flutter calls /api/status for attendance
app.use('/api/status', attendanceRouter);

app.use('/api/checkin', checkinRouter);
// Alias: Flutter calls /api/visits for check-ins
app.use('/api/visits', checkinRouter);

app.use('/api/admin', require('./routes/admin'));
app.use('/api/analytics', require('./routes/analytics'));

// Mount Swagger Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Default Route
app.get('/', (req, res) => {
  res.send('Trakr Backend Engine is running. Visit /api-docs for Swagger specifications.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Swagger specs available at http://localhost:${PORT}/api-docs`);
});
