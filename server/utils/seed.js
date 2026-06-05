const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const CheckIn = require('../models/CheckIn');
const AttendanceLog = require('../models/AttendanceLog');
const Insight = require('../models/Insight');

const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seeding.');
      return;
    }

    console.log('Seeding multi-region database with scoped corporate hierarchy...');

    // Clear any dangling records
    await User.deleteMany({});
    await Company.deleteMany({});
    await CheckIn.deleteMany({});
    await AttendanceLog.deleteMany({});
    await Insight.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    // 1. Create System Admin (completely outside the pyramid hierarchy)
    const adminId = new mongoose.Types.ObjectId();
    await User.create({
      _id: adminId,
      name: 'System Admin',
      email: 'admin@trakr.com',
      password: defaultPassword,
      role: 'Admin',
      parentId: null,
      path: `,${adminId},`,
      region: 'Global'
    });

    // ==========================================
    // ============ SEED 1: HORLICKS ============
    // ==========================================

    // 2. Create Corporate Owner (Apex)
    const ownerId = new mongoose.Types.ObjectId();
    await User.create({
      _id: ownerId,
      name: 'Mr. Horlicks Owner',
      email: 'owner@horlicks.com',
      password: defaultPassword,
      role: 'Owner',
      parentId: null,
      path: `,${ownerId},`,
      region: 'Global'
    });

    // Create Tenant Company
    await Company.create({
      name: 'Horlicks',
      subscription: 'Active',
      employeeCount: 7,
      dbHealth: 'Healthy',
      apiKey: 'trakr_live_horlicksseedkey'
    });

    // ================== NORTH REGION ==================
    // 3. Create Super Official - North (Regional Head)
    const northHeadId = new mongoose.Types.ObjectId();
    await User.create({
      _id: northHeadId,
      name: 'Ramesh Kumar (North Zone Head)',
      email: 'ramesh@horlicks.com',
      password: defaultPassword,
      role: 'SuperOfficial',
      parentId: ownerId,
      path: `,${ownerId},${northHeadId},`,
      region: 'North Zone'
    });

    // 4. Create Branch Manager - Delhi
    const delhiManagerId = new mongoose.Types.ObjectId();
    await User.create({
      _id: delhiManagerId,
      name: 'Vikram Singh (Delhi Manager)',
      email: 'vikram@horlicks.com',
      password: defaultPassword,
      role: 'Manager',
      parentId: northHeadId,
      path: `,${ownerId},${northHeadId},${delhiManagerId},`,
      region: 'North Zone'
    });

    // 5. Create Salespeople under Delhi Manager
    const rajId = new mongoose.Types.ObjectId();
    await User.create({
      _id: rajId,
      name: 'Raj Sharma',
      email: 'raj@horlicks.com',
      password: defaultPassword,
      role: 'Salesperson',
      parentId: delhiManagerId,
      path: `,${ownerId},${northHeadId},${delhiManagerId},${rajId},`,
      region: 'North Zone'
    });

    const amanId = new mongoose.Types.ObjectId();
    await User.create({
      _id: amanId,
      name: 'Aman Verma',
      email: 'aman@horlicks.com',
      password: defaultPassword,
      role: 'Salesperson',
      parentId: delhiManagerId,
      path: `,${ownerId},${northHeadId},${delhiManagerId},${amanId},`,
      region: 'North Zone'
    });

    // ================== SOUTH REGION ==================
    // 6. Create Super Official - South (Regional Head)
    const southHeadId = new mongoose.Types.ObjectId();
    await User.create({
      _id: southHeadId,
      name: 'Suresh Menon (South Zone Head)',
      email: 'suresh@horlicks.com',
      password: defaultPassword,
      role: 'SuperOfficial',
      parentId: ownerId,
      path: `,${ownerId},${southHeadId},`,
      region: 'South Zone'
    });

    // 7. Create Branch Manager - Bangalore
    const bangaloreManagerId = new mongoose.Types.ObjectId();
    await User.create({
      _id: bangaloreManagerId,
      name: 'Karan Malhotra (Bangalore Manager)',
      email: 'karan@horlicks.com',
      password: defaultPassword,
      role: 'Manager',
      parentId: southHeadId,
      path: `,${ownerId},${southHeadId},${bangaloreManagerId},`,
      region: 'South Zone'
    });

    // 8. Create Salespeople under Bangalore Manager
    const vijayId = new mongoose.Types.ObjectId();
    await User.create({
      _id: vijayId,
      name: 'Vijay Iyer',
      email: 'vijay@horlicks.com',
      password: defaultPassword,
      role: 'Salesperson',
      parentId: bangaloreManagerId,
      path: `,${ownerId},${southHeadId},${bangaloreManagerId},${vijayId},`,
      region: 'South Zone'
    });

    // 9. Create Attendance Logs (some active, break, hold)
    await AttendanceLog.create([
      { userId: rajId, status: 'Active', timestamp: new Date(Date.now() - 1000 * 3600 * 4) },
      { userId: amanId, status: 'Hold', reason: 'Traffic Delay', timestamp: new Date(Date.now() - 1000 * 3600 * 2) },
      { userId: vijayId, status: 'Active', timestamp: new Date(Date.now() - 1000 * 3600 * 3) }
    ]);

    // 10. Create Check-Ins
    await CheckIn.create([
      {
        salespersonId: rajId,
        region: 'North Zone',
        shopName: 'Reliance Fresh',
        summary: 'Restocked Horlicks classic in Delhi CP Reliance Fresh.',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
        timestamp: new Date(Date.now() - 1000 * 3600 * 3),
        location: { type: 'Point', coordinates: [77.2092, 28.6141] },
        isAnomaly: false,
        distance: 25
      },
      {
        salespersonId: rajId,
        region: 'North Zone',
        shopName: 'Horlicks Outlet',
        summary: 'Delivered promo banners to Janpath store. GPS coords are offset.',
        imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80',
        timestamp: new Date(Date.now() - 1000 * 3600 * 1),
        location: { type: 'Point', coordinates: [77.2200, 28.6250] },
        isAnomaly: true,
        distance: 1720
      },
      {
        salespersonId: vijayId,
        region: 'South Zone',
        shopName: 'Walmart Supercenter',
        summary: 'Completed monthly auditing for South region branches.',
        imageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=300&q=80',
        timestamp: new Date(Date.now() - 1000 * 3600 * 2),
        location: { type: 'Point', coordinates: [77.2155, 28.6112] },
        isAnomaly: false,
        distance: 60
      }
    ]);

    // ==========================================
    // ============ SEED 2: NIGHATECH ===========
    // ==========================================

    const ownerNigaId = new mongoose.Types.ObjectId();
    await User.create({
      _id: ownerNigaId,
      name: 'Mr. NighaTech Owner',
      email: 'owner@nighatech.com',
      password: defaultPassword,
      role: 'Owner',
      parentId: null,
      path: `,${ownerNigaId},`,
      region: 'Global'
    });

    await Company.create({
      name: 'NighaTech',
      subscription: 'Active',
      employeeCount: 7,
      dbHealth: 'Healthy',
      apiKey: 'trakr_live_nighatechseedkey'
    });

    // ================== NORTH REGION ==================
    const northHeadNigaId = new mongoose.Types.ObjectId();
    await User.create({
      _id: northHeadNigaId,
      name: 'Ramesh Kumar (North Zone Head)',
      email: 'ramesh@nighatech.com',
      password: defaultPassword,
      role: 'SuperOfficial',
      parentId: ownerNigaId,
      path: `,${ownerNigaId},${northHeadNigaId},`,
      region: 'North Zone'
    });

    const delhiManagerNigaId = new mongoose.Types.ObjectId();
    await User.create({
      _id: delhiManagerNigaId,
      name: 'Vikram Singh (Delhi Manager)',
      email: 'vikram@nighatech.com',
      password: defaultPassword,
      role: 'Manager',
      parentId: northHeadNigaId,
      path: `,${ownerNigaId},${northHeadNigaId},${delhiManagerNigaId},`,
      region: 'North Zone'
    });

    const rajNigaId = new mongoose.Types.ObjectId();
    await User.create({
      _id: rajNigaId,
      name: 'Raj Sharma',
      email: 'raj@nighatech.com',
      password: defaultPassword,
      role: 'Salesperson',
      parentId: delhiManagerNigaId,
      path: `,${ownerNigaId},${northHeadNigaId},${delhiManagerNigaId},${rajNigaId},`,
      region: 'North Zone'
    });

    const amanNigaId = new mongoose.Types.ObjectId();
    await User.create({
      _id: amanNigaId,
      name: 'Aman Verma',
      email: 'aman@nighatech.com',
      password: defaultPassword,
      role: 'Salesperson',
      parentId: delhiManagerNigaId,
      path: `,${ownerNigaId},${northHeadNigaId},${delhiManagerNigaId},${amanNigaId},`,
      region: 'North Zone'
    });

    // ================== SOUTH REGION ==================
    const southHeadNigaId = new mongoose.Types.ObjectId();
    await User.create({
      _id: southHeadNigaId,
      name: 'Suresh Menon (South Zone Head)',
      email: 'suresh@nighatech.com',
      password: defaultPassword,
      role: 'SuperOfficial',
      parentId: ownerNigaId,
      path: `,${ownerNigaId},${southHeadNigaId},`,
      region: 'South Zone'
    });

    const bangaloreManagerNigaId = new mongoose.Types.ObjectId();
    await User.create({
      _id: bangaloreManagerNigaId,
      name: 'Karan Malhotra (Bangalore Manager)',
      email: 'karan@nighatech.com',
      password: defaultPassword,
      role: 'Manager',
      parentId: southHeadNigaId,
      path: `,${ownerNigaId},${southHeadNigaId},${bangaloreManagerNigaId},`,
      region: 'South Zone'
    });

    const vijayNigaId = new mongoose.Types.ObjectId();
    await User.create({
      _id: vijayNigaId,
      name: 'Vijay Iyer',
      email: 'vijay@nighatech.com',
      password: defaultPassword,
      role: 'Salesperson',
      parentId: bangaloreManagerNigaId,
      path: `,${ownerNigaId},${southHeadNigaId},${bangaloreManagerNigaId},${vijayNigaId},`,
      region: 'South Zone'
    });

    // Create Attendance Logs for NighaTech
    await AttendanceLog.create([
      { userId: rajNigaId, status: 'Active', timestamp: new Date(Date.now() - 1000 * 3600 * 4) },
      { userId: amanNigaId, status: 'Hold', reason: 'Traffic Delay', timestamp: new Date(Date.now() - 1000 * 3600 * 2) },
      { userId: vijayNigaId, status: 'Active', timestamp: new Date(Date.now() - 1000 * 3600 * 3) }
    ]);

    // Create Check-Ins for NighaTech
    await CheckIn.create([
      {
        salespersonId: rajNigaId,
        region: 'North Zone',
        shopName: 'NighaTech Delhi HQ',
        summary: 'Verified system deployments at main corporate server hub.',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
        timestamp: new Date(Date.now() - 1000 * 3600 * 3),
        location: { type: 'Point', coordinates: [77.2092, 28.6141] },
        isAnomaly: false,
        distance: 12
      },
      {
        salespersonId: rajNigaId,
        region: 'North Zone',
        shopName: 'NighaTech CP Office',
        summary: 'Met with client representatives for product demo. GPS verified.',
        imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80',
        timestamp: new Date(Date.now() - 1000 * 3600 * 1),
        location: { type: 'Point', coordinates: [77.2200, 28.6250] },
        isAnomaly: true,
        distance: 1850
      },
      {
        salespersonId: vijayNigaId,
        region: 'South Zone',
        shopName: 'NighaTech South Center',
        summary: 'Routine health check and network compliance check complete.',
        imageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=300&q=80',
        timestamp: new Date(Date.now() - 1000 * 3600 * 2),
        location: { type: 'Point', coordinates: [77.2155, 28.6112] },
        isAnomaly: false,
        distance: 45
      }
    ]);

    // Create pre-populated insights for NighaTech
    await Insight.create([
      {
        senderId: delhiManagerNigaId,
        receiverId: northHeadNigaId,
        region: 'North Zone',
        content: 'Branch Report for North Zone: 2 check-ins, 1 active salespeople, and 1 geofence anomalies detected today.',
        metrics: { totalCheckIns: 2, activeSalespeople: 1, anomaliesCount: 1 },
        timestamp: new Date(Date.now() - 1000 * 3600 * 1.5)
      },
      {
        senderId: northHeadNigaId,
        receiverId: ownerNigaId,
        region: 'North Zone',
        content: 'Regional Report for North Zone: 2 total check-ins, 2 active salespeople, and 1 branch managers reporting in our territory today.',
        metrics: { totalCheckIns: 2, activeSalespeople: 2, anomaliesCount: 1 },
        timestamp: new Date(Date.now() - 1000 * 3600 * 0.5)
      }
    ]);

    console.log('Seeded NighaTech and Horlicks datasets successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
