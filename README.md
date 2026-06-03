# AasaMedChem - Inventory & Order Management System

AasaMedChem is a hackathon-style inventory and order management system built for B2B chemical and medicinal component procurement. The system features a responsive, glassmorphic UI, custom cookie-based JWT authentication, a flexible unit conversion engine, and high-precision pricing calculations.

## Live Application
- **Vercel URL**: `https://assignment-aasamedchem.vercel.app` (or your configured Vercel live link)

---

## 🌟 Key Features

1. **Role-Based Access Control**:
   - **Admin Portal**: Add/edit/delete products, configure pricing, view real-time inventory levels, inspect incoming orders, and approve/reject orders (stock is transactionally verified and deducted upon approval).
   - **Seller Portal**: Browse and filter chemical products, compile a multi-item order cart with flexible units, view live pricing conversions with detailed breakdowns, and track order histories.
2. **Flexible Unit Conversions**:
   - Seamlessly convert within Weight (`g` <-> `kg`), Volume (`mL` <-> `L`), and Count (`items`) dimensions.
   - Allows Sellers to order in any unit (e.g., `g`) even when product price or base unit is set in another (e.g., `kg`).
   - Dynamically displays the live conversion math in both Seller and Admin panels.
3. **High-Precision Calculations**:
   - Stores quantities and pricing using PostgreSQL `Decimal` types (`NUMERIC(20, 8)`) to eliminate floating-point rounding errors.
   - Backed by Prisma's `Decimal.js` mapping in Node.js server routes.

---

## 🛠️ Tech Stack & Architecture

```mermaid
graph TD
  User([Web Browser]) <--> |HTTP / JSON / Cookies| NextJS[Next.js App Router]
  subgraph NextJS
    UI[React Client Components] <--> |Fetch API| Router[API Route Handlers]
    Auth[JWT Session & bcrypt Hashing] <--> Router
    Converter[Unit Conversion Engine] <--> UI & Router
    Prisma[Prisma ORM Client] <--> Router
  end
  Prisma <--> |pg driver adapter| PG[(Neon PostgreSQL)]
```

- **Frontend**: Next.js (App Router), React 19, TypeScript.
- **Styling**: Premium Vanilla CSS (Cohesive global variables, CSS Modules, dark theme by default, hover elevations, and interactive glassmorphic cards).
- **Backend**: Next.js Route Handlers (RESTful API), custom JWT session validation (stored in a secure, `httpOnly`, `sameSite: strict` cookie).
- **Database & ORM**: PostgreSQL (hosted on Neon) accessed through Prisma 7 using the PostgreSQL driver adapter (`@prisma/adapter-pg` & `pg`).

---

## 🗄️ Database Schema & Precision

All numeric storage columns (stock, pricing, and item quantities) utilize PostgreSQL's `Decimal(20, 8)` type. 

### Why `Decimal(20, 8)`?
- **High Decimal Precision**: In medicinal chemistry, small changes in mass (e.g., milligrams `0.001 g`) represent significant values. We support up to 8 decimal places to handle micro-measurements and high precision conversion factors without rounding discrepancies.
- **Large Values**: 12 digits before the decimal place can support large enterprise stocks (up to 999 Billion units) and total INR prices, scaling easily from lab use to industrial procurement.

### Key Tables

#### 1. `User` (User Accounts)
- `id` (`String`, Primary Key, UUID)
- `email` (`String`, Unique)
- `username` (`String`, Unique)
- `passwordHash` (`String`)
- `role` (`Enum: ADMIN, SELLER`)
- `createdAt` / `updatedAt` (`DateTime`)

#### 2. `Product` (Chemical Catalog)
- `id` (`String`, Primary Key, UUID)
- `name` (`String`)
- `sku` (`String`, Unique)
- `description` (`String`, Nullable)
- `category` (`String`)
- `dimension` (`Enum: WEIGHT, VOLUME, COUNT`)
- `baseUnit` (`String` - default base unit e.g. `g` for weights, `mL` for volumes)
- `stock` (`Decimal(20, 8)` - stock quantity tracked in `baseUnit`)
- `price` (`Decimal(20, 8)` - base price rate per `priceUnit`)
- `priceUnit` (`String` - unit for pricing e.g. `kg`, `L`, `items`)

#### 3. `Order` (Quotation/Order Records)
- `id` (`String`, Primary Key, UUID)
- `userId` (`String`, Foreign Key referencing `User`)
- `status` (`Enum: PENDING, APPROVED, REJECTED` - default `PENDING`)
- `totalAmount` (`Decimal(20, 8)` - total quotation cost in INR)
- `notes` (`String`, Nullable)

#### 4. `OrderItem` (Order Items List)
- `id` (`String`, Primary Key, UUID)
- `orderId` (`String`, Foreign Key referencing `Order`)
- `productId` (`String`, Foreign Key referencing `Product`)
- `orderedQuantity` (`Decimal(20, 8)` - quantity value entered by the user)
- `orderedUnit` (`String` - unit selected by the user, e.g. `kg`)
- `baseQuantity` (`Decimal(20, 8)` - equivalent quantity converted to `baseUnit` for stock tracking)
- `pricePerUnit` (`Decimal(20, 8)` - historical price rate at time of order)
- `priceUnit` (`String` - pricing rate unit)
- `subtotal` (`Decimal(20, 8)` - subtotal price in INR)

---

## 📏 Unit Storage & Conversion Strategy

### 1. Dimension Standard Configuration
We group unit conversions within distinct dimensions to avoid cross-dimension conversion errors (e.g. converting grams to liters is blocked):

| Dimension | Supported Units | Base Unit (Internal Storage) | Conversion Factors to Base |
| :--- | :--- | :--- | :--- |
| **WEIGHT** | `g`, `kg` | `g` | 1 `kg` = 1,000 `g`<br>1 `g` = 1 `g` |
| **VOLUME** | `mL`, `L` | `mL` | 1 `L` = 1,000 `mL`<br>1 `mL` = 1 `mL` |
| **COUNT** | `items` | `items` | 1 `items` = 1 `items` |

### 2. Conversions in Action
Conversions are applied in three main places in the codebase:
1. **Cart live prices (Client)**: As the Seller adjusts quantities or switches units, a client-side conversion converts the entered quantity into the pricing rate unit to update the subtotal in real-time.
2. **Order Placement (Server / POST `/api/orders`)**: 
   - Converts the ordered quantity to the product's configured price unit to verify pricing calculations.
   - Converts the ordered quantity to the product's base unit to record `baseQuantity` for inventory auditing.
3. **Quotation Approval (Server / PATCH `/api/orders/[id]/status`)**:
   - The transaction verifies that `product.stock` (in base unit) is `>= orderItem.baseQuantity`.
   - Upon approval, the stock is updated in the database: `stock = stock - baseQuantity`.

---

## 🚀 Setup & Installation (Local Development)

### Prerequisites
- Node.js (v18.x or later)
- PostgreSQL database (Local or Neon URL)

### 1. Clone the project and install dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Create a `.env` file in the root directory:
```env
# Database Connection
DATABASE_URL="postgresql://username:password@ep-host-name.neon.tech/dbname?sslmode=require"

# JWT Auth Secret (Must be a secure 32+ char string)
JWT_SECRET="glowing-neon-chemical-inventory-key-32-chars-long"

# Node Environment
NODE_ENV="development"
```

### 3. Apply Prisma Migrations
Sync the database schema with your database (this will create tables):
```bash
npx prisma db push
```

### 4. Seed the Database
Populate the database with default users and mock chemical products:
```bash
npx tsx prisma/seed.ts
```

### 5. Run the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Test Credentials & Verification Walkthrough

Run the seed script to enable the following test accounts:

### 1. Admin Portal Walkthrough
- **Identity**: `admin` (or `admin@medchem.com`)
- **Password**: `admin123`
- **Actions**:
  1. Click **Inventory Management** to view all chemical stock.
  2. Click **Add Product** to create a new component. Choose WEIGHT, set base storage unit to `g`, and pricing to ₹500 per `kg`.
  3. Select **Quotations & Orders** tab to track seller requests.

### 2. Seller Portal Walkthrough
- **Identity**: `seller` (or `seller@medchem.com`)
- **Password**: `seller123`
- **Actions**:
  1. Browse the products catalog. Add the newly created chemical to the cart.
  2. Type `2.5` in quantity, select `kg` as unit. Notice the subtotal displays as **₹1,250.00** (`2.5 kg * ₹500/kg`).
  3. Change the unit to `g` and quantity to `500`. Notice the subtotal automatically updates to **₹250.00** (`500 g -> 0.5 kg * ₹500/kg`).
  4. Write notes (e.g. "Deliver to Lab 4B") and click **Submit Quotation / Order**.

### 3. Approval & Dispatch Validation
  1. Log back in as `admin`.
  2. In **Quotations & Orders**, view the pending order. Under **Internal Pricing Calculation Verification**, check the step-by-step conversion logic calculated by the database.
  3. Check the stock verification tag. If stock is available, click **Approve & Dispatch**.
  4. Navigate back to **Inventory Management**; verify that the stock of the product has correctly decreased by the base quantity.

---

## ☁️ Vercel Deployment Instructions

### 1. Deploy via CLI or Vercel Dashboard
- Push your code to a GitHub repository.
- Connect the repository to Vercel.
- **Environment Variables**: Make sure to add `DATABASE_URL` (your Neon URL) and `JWT_SECRET` inside your Vercel Project Settings.

### 2. Database Migrations on Vercel
Vercel automatically runs builds. You can set the Vercel Build Command to push your schema dynamically to Neon:
```bash
npx prisma db push && next build
```
This guarantees that any changes to your Prisma schema are updated in Neon during the deployment pipeline.
