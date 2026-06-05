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

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
connectDB().then(() => {
  // Seed database after successful connection
  seedDatabase();
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/checkin', require('./routes/checkin'));
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
