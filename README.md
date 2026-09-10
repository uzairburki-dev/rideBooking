# RideGo — Your Ride, Your Journey

RideGo is a full-stack MVC **Ride Booking & Fleet Management System** built using Node.js, Express.js, MongoDB, Mongoose, EJS, Bootstrap 5, and Font Awesome.

---

## 🚀 Key Features

### 👤 Customer Module
- **Registration & Authentication**: Secure sign-up, login, and session-based role authorization.
- **Interactive Ride Booking**: Fare calculation using Haversine distance estimation and multi-tier pricing (`Economy`, `Comfort`, `Premium`, `SUV`).
- **Live Ride Tracking**: Real-time status pipeline (`requested` $\rightarrow$ `accepted` $\rightarrow$ `driver_arriving` $\rightarrow$ `driver_arrived` $\rightarrow$ `started` $\rightarrow$ `completed`).
- **Ride Cancellation**: Cancel pending bookings with optional reason logging.
- **Demo Payment System**: Sandbox checkout supporting simulated Demo Card and Cash payment options with transaction reference generation (`RG-TXN-...`).
- **Payment History**: View detailed payment receipts, settlement dates, and payment history log.
- **Driver Rating & Reviews**: Submit 1–5 star ratings and feedback for completed rides.

### 🚕 Driver Module
- **Driver Registration & Profile**: Register driver license and vehicle details (`brand`, `model`, `year`, `registrationNumber`, `vehicleType`).
- **Approval Queue Status**: Pending approval status preventing unapproved drivers from going online.
- **Online / Offline Toggle**: Manage operational status to receive ride requests.
- **Atomic Ride Dispatch**: Single-click ride request acceptance using atomic MongoDB updates (`findOneAndUpdate`) to prevent double-booking race conditions.
- **Trip Lifecycle Management**: Transition rides seamlessly from pickup arrival to trip start and completion.
- **Earnings & Ratings Dashboard**: Track daily earnings, total payouts, average fare per trip, rating score breakdown, and customer feedback.

### 🛡️ Admin Dashboard & Management System
- **Real Database Metrics**: Live statistics queried directly from MongoDB for Customers, Drivers, Rides, Payments, Revenue, and Reviews.
- **Customer Management**: Search, filter, view spending metrics, and toggle active/inactive account status.
- **Driver Management & Approvals Queue**: Dedicated application review queue to approve or reject pending drivers with reason logging, and toggle driver account statuses.
- **Ride Inspection**: Master log of all system bookings with status and payment filters.
- **Payment Transactions Log**: Track settled payouts, pending cash payments, and failed transactions.
- **Review Moderation**: Moderate customer reviews with automatic server-side recalculation of driver average rating scores.
- **Reports & Analytics**: Comprehensive system reports (completion rates, revenue breakdowns, driver ratios, rating distributions) with date range filtering (`All Time`, `Today`, `7 Days`, `30 Days`, `This Month`).

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose ODM
- **Templating**: EJS (Embedded JavaScript) with `express-ejs-layouts`
- **Frontend UI**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Font Awesome
- **Authentication & Security**: Express Sessions (`express-session`), MongoStore (`connect-mongo`), BcryptJS, Helmet, Morgan, Method-Override, Connect-Flash

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v16+ recommended)
- MongoDB server running locally or a MongoDB Atlas URI.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to create a `.env` file:
```bash
cp .env.example .env
```

Configure your environment variables in `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/ridego_db
SESSION_SECRET=ridego_production_secret_key_2026
NODE_ENV=development
```

### 4. Start the Application
```bash
npm start
```
Or run in development mode:
```bash
npm run dev
```

Visit the application in your browser at `http://localhost:3000`.

---

## 🔑 Default Credentials

### Administrator Account
- **Login URL**: `http://localhost:3000/login`
- **Email**: `admin@ridego.com`
- **Password**: `adminpassword`

---

## 📂 Project Architecture

```text
ride-booking-system/
├── config/             # Database connection & system configuration
├── controllers/        # MVC Controllers (Auth, Customer, Driver, Ride, Payment, Review, Admin)
├── middleware/         # Authentication, authorization, and error handling middleware
├── models/             # Mongoose Schemas (User, Driver, Vehicle, Ride, Payment, Review, RideRejection)
├── public/             # Static assets (CSS styles, JS client utilities, images)
├── routes/             # Express Router modules
├── utils/              # Haversine distance & fare calculators
├── views/              # EJS Templates (Auth, Customer, Driver, Admin, Partials, Layouts, Errors)
├── .env.example        # Template environment variables
├── .gitignore          # Git exclusion rules
├── package.json        # Dependencies & start scripts
├── app.js              # Express app setup & middleware pipeline
└── server.js           # HTTP server entry point
```

---

## 🔐 Security & Data Integrity

- **Password Encryption**: Hashed using `bcryptjs` with salt rounds = 10. Passwords are never returned in database responses or views.
- **Server-Side Authorization**: Role checking (`customer`, `driver`, `admin`) enforced strictly on the server side via custom middleware.
- **Atomic Operations**: Atomic `findOneAndUpdate` prevents race conditions where multiple drivers attempt to accept the same ride.
- **Fare & Payment Protection**: Payment amounts are strictly derived from `ride.fare` on the server. Client-submitted payment amounts or roles are ignored.
- **Zero Sensitive Storage**: Demo card inputs are processed strictly in sandbox memory for simulation and are never stored or logged in MongoDB.

---

## 📈 Future Roadmap

- Real-time WebSockets dispatch & continuous GPS tracking.
- Integration with live payment gateways (Stripe, PayPal, JazzCash, Easypaisa).
- Automated SMS and Email notifications via Twilio & SendGrid.
- Advanced driver document verification & OCR inspection.

---

## 📄 License
This project is developed as an educational final project. All rights reserved.
