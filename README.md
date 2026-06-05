# 📍 Trakr - Enterprise Sales & Attendance Tracker

Trakr is a multi-tenant, hierarchical sales force tracking and attendance monitoring dashboard. It allows companies to track sales representatives' geofenced check-ins, resolve GPS anomalies, report region-based insights up the corporate pyramid, and monitor real-time worker statuses.

---

## 🏗️ Project Architecture

The project is structured into two main directories:
1. **`/client`**: Frontend application built using **React, Vite, Tailwind CSS, and Lucide Icons**.
2. **`/server`**: Backend REST API built using **Node.js, Express, MongoDB, and Mongoose**.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (running locally or a remote URI)

### Setup & Run

#### 1. Backend Server Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environmental variables (e.g., in a `.env` file or default config):
   * `PORT`: Server port (default: `5000`)
   * `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/trakr`)
   * `JWT_SECRET`: Secret key for authentication tokens
4. Start the server in development mode:
   ```bash
   npm run dev
   ```

#### 2. Frontend Client Setup
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the client development server:
   ```bash
   npm run dev
   ```
   The client will run on [http://localhost:5173](http://localhost:5173).

---

## 🔑 Demo Static Seed Credentials

The application is pre-seeded with hierarchical corporate datasets for two tenants: **NighaTech** and **Horlicks**.

> 💡 **Password for all seeded accounts:** `password123`

### 1. NighaTech (Demo Tenant 1)

| Hierarchy Level | Role | Name | Email Address | Assigned Region |
| :--- | :--- | :--- | :--- | :--- |
| **Level 4 (Apex)** | Owner | Mr. NighaTech Owner | `owner@nighatech.com` | Global |
| **Level 3** | Super Official (North Zone Head) | Ramesh Kumar | `ramesh@nighatech.com` | North Zone |
| **Level 3** | Super Official (South Zone Head) | Suresh Menon | `suresh@nighatech.com` | South Zone |
| **Level 2** | Branch Manager (Delhi) | Vikram Singh | `vikram@nighatech.com` | North Zone |
| **Level 2** | Branch Manager (Bangalore) | Karan Malhotra | `karan@nighatech.com` | South Zone |
| **Level 1** | Salesperson (Delhi) | Raj Sharma | `raj@nighatech.com` | North Zone |
| **Level 1** | Salesperson (Delhi) | Aman Verma | `aman@nighatech.com` | North Zone |
| **Level 1** | Salesperson (Bangalore) | Vijay Iyer | `vijay@nighatech.com` | South Zone |

### 2. Horlicks (Demo Tenant 2)

| Hierarchy Level | Role | Name | Email Address | Assigned Region |
| :--- | :--- | :--- | :--- | :--- |
| **Level 4 (Apex)** | Owner | Mr. Horlicks Owner | `owner@horlicks.com` | Global |
| **Level 3** | Super Official (North Zone Head) | Ramesh Kumar | `ramesh@horlicks.com` | North Zone |
| **Level 3** | Super Official (South Zone Head) | Suresh Menon | `suresh@horlicks.com` | South Zone |
| **Level 2** | Branch Manager (Delhi) | Vikram Singh | `vikram@horlicks.com` | North Zone |
| **Level 2** | Branch Manager (Bangalore) | Karan Malhotra | `karan@horlicks.com` | South Zone |
| **Level 1** | Salesperson (Delhi) | Raj Sharma | `raj@horlicks.com` | North Zone |
| **Level 1** | Salesperson (Delhi) | Aman Verma | `aman@horlicks.com` | North Zone |
| **Level 1** | Salesperson (Bangalore) | Vijay Iyer | `vijay@horlicks.com` | South Zone |

---

## 🛠️ Features & Demo Flows

1. **Hierarchy Access Control**: Each user only sees data corresponding to their branch/region as per the paths seeded.
2. **Salesperson Manual Check-Ins**: Salespeople can manually type shop names during check-in, bypassing pre-defined dropdown selections.
3. **Manager Alert & Resolution Center**: Branch managers inspect anomalous check-ins (e.g., GPS coordinates outside geofence boundary) and can mark them as **Accepted** or **Rejected**.
4. **Insights Dashboard**:
   * Branch Managers compile and report performance metrics upwards to Super Officials.
   * Super Officials view Branch Manager insights as text summaries or interactive bar charts.
   * Super Officials can escalate insights upward to the Corporate Owner.
   * The Owner has an aggregated dashboard showing all metrics, maps, regional zones, and user logs.
