# StockPro - Modern Inventory Management & POS System

A production-ready, full-stack Inventory Management and Point of Sale (POS) system built with **Node.js, Express.js (ES Modules), Prisma ORM, PostgreSQL (Neon / Supabase compatible)** and a component-driven **Next.js (App Router)** frontend.

---

## 🌟 Key Features

### 1. 📦 "Sell Per Piece or Per Box" Engine
Designed specifically for shops and wholesalers selling products in flexible packaging:
- **Piece Only Mode**: Sell individual units (e.g., Electronics, single items).
- **Box Only Mode**: Sell only complete cartons/cases (e.g., Wholesale beverage crates).
- **Both (Piece & Box) Mode**: Customers can choose to buy either single loose pieces or full boxes.
- **Accurate Mathematical Inventory**: Base stock is always tracked in individual single pieces (`stockPieces`). When 1 box is sold, the system automatically deducts `1 * piecesPerBox` pieces from inventory atomically via database transactions.
- **Dynamic Live Conversion**: Displays both total boxes and remaining loose pieces in real-time (e.g. `10 Boxes, 4 Pieces (124 total pcs)`).

### 2. 🛒 Sidebar "Create Order" (Point of Sale / POS)
- Dedicated sidebar option for counter sales.
- Search catalog by name, category, or SKU barcode.
- Quick buttons to sell as **Piece ($X)** or **Box ($Y)**.
- Real-time stock availability check preventing sales beyond available inventory.
- Walk-in or named customer, cash/card/online payment options, discount and tax calculations.
- Instant database deduction and printable receipt/invoice modal.

### 3. 📜 Stock Movements & Sales History
- **Sales History**: Complete log of every order with customer details, items snapshot, payment method, and one-click refund/cancellation (which automatically restores deducted stock).
- **Audit Trail**: Detailed log of every single stock event (`SALE`, `RESTOCK`, `RETURN`, `INITIAL`, `ADJUSTMENT`) with previous balance and balance after.

### 4. 🔐 Single Admin Security
- Protected admin routes using JWT authentication and bcrypt password hashing.
- Single admin account initialization with pre-seed scripts.

---

## 📁 Project Architecture

```
Inventory Qaisar/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL Schema (Product, Order, OrderItem, StockLog, Admin)
│   │   └── seed.js              # Database Seeder (Admin + Sample Piece/Box products)
│   ├── src/
│   │   ├── config/              # Environment config
│   │   ├── controllers/         # auth, product, order, history controllers
│   │   ├── middlewares/         # JWT auth and global error handler
│   │   ├── prisma/              # PrismaClient singleton
│   │   ├── routes/              # Modular Express routes
│   │   ├── services/            # Business logic layer & atomic transactions
│   │   ├── utils/               # Response formatters & order number generator
│   │   └── server.js            # Express app entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── globals.css      # Custom design system with modern tokens
    │   │   ├── layout.js        # Root provider wrapper
    │   │   ├── page.js          # Dashboard overview & analytics
    │   │   ├── login/           # Admin login page
    │   │   ├── pos/             # "Create Order" / POS screen
    │   │   ├── products/        # Products catalog & management
    │   │   ├── orders/          # Sales orders history & invoice modal
    │   │   └── history/         # Stock movement audit trail
    │   ├── components/
    │   │   ├── layout/          # Sidebar, Header, AppLayout
    │   │   ├── ui/              # Button, Modal, Badge
    │   │   ├── products/        # ProductFormModal, StockAdjustModal
    │   │   └── orders/          # ReceiptModal
    │   ├── context/             # AuthContext, ToastContext
    │   └── services/            # ApiClient (Fetch client with JWT)
    ├── .env.local
    └── package.json
```

---

## 🚀 Quick Setup & Run Instructions

### 1. Database Configuration (PostgreSQL / Neon / Supabase)

StockPro uses **PostgreSQL**. You can use:
- **Neon DB** (Free serverless Postgres: [neon.tech](https://neon.tech))
- **Supabase** (Free Postgres: [supabase.com](https://supabase.com))
- **Local PostgreSQL** (or Docker)

Open `backend/.env` and update `DATABASE_URL`:
```env
DATABASE_URL="postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require"
```

### 2. Initialize Backend Database

In your terminal:
```bash
cd backend

# Push the Prisma schema to create tables
npx prisma db push

# Seed initial admin and sample products (piece & box showcase)
npm run prisma:seed

# Start the Backend server
npm run dev
```
The backend API will run on **http://localhost:5000**.
- Default Admin Email: `admin@inventory.com`
- Default Admin Password: `admin123`

### 3. Run Frontend (Next.js)

In a new terminal:
```bash
cd frontend

# Start Next.js development server
npm run dev
```
Open **http://localhost:3000** in your browser.
Click **"Fill Demo Admin Credentials"** or log in with `admin@inventory.com` / `admin123`.

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Admin login & returns JWT |
| `GET` | `/api/auth/me` | Current admin profile |
| `GET` | `/api/products` | Get products with search & category filters |
| `POST` | `/api/products` | Create product with Piece/Box/Both settings |
| `PUT` | `/api/products/:id` | Update product details |
| `POST` | `/api/products/:id/adjust-stock` | Restock or manually adjust inventory |
| `DELETE` | `/api/products/:id` | Delete product |
| `POST` | `/api/orders` | Create sale order (atomic stock deduction) |
| `GET` | `/api/orders` | Get all completed sales & order history |
| `POST` | `/api/orders/:id/cancel` | Cancel order & restore inventory |
| `GET` | `/api/history/stock-logs` | Chronological stock movement audit trail |
| `GET` | `/api/history/dashboard-metrics` | Aggregated revenue & KPI metrics |
