# Areej Al Aqhwan - E-commerce & Admin Panel

A full-stack bilingual (Arabic/English) e-commerce platform for a flower and gift shop, built with Next.js 16, MongoDB, and Tailwind CSS v4.

## Features

### E-commerce Frontend
- Beautiful RTL homepage with hero banner (image/video)
- Product catalog with category filtering and search
- Product detail pages with image gallery
- Shopping cart with slide-out drawer (Zustand state)
- Checkout with customer info form
- Bilingual support (Arabic/English) with language toggle
- Responsive design optimized for mobile

### Admin Panel (`/admin`)
- Secure login with bcrypt password hashing
- Dashboard with revenue, orders, and product stats
- **Invoice System**: Create, print, share via WhatsApp
- **Product Management**: CRUD with image upload (auto WebP conversion)
- **Order Management**: View, filter by status, update status
- **Customer Loyalty**: Auto-tracked tiers (New > Bronze > Silver > Gold > Platinum)
- **Settings**: VAT toggle, social media links, branding (logo/banner), language config

### API Routes
- `/api/auth` - Admin authentication
- `/api/products` - Product CRUD with filtering
- `/api/invoices` - Invoice CRUD
- `/api/orders` - Order management
- `/api/customers` - Customer loyalty tracking
- `/api/settings` - Store settings
- `/api/upload` - Image upload with Sharp WebP conversion
- `/api/dashboard` - Dashboard analytics
- `/api/seed` - Database seeding

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: MongoDB with Mongoose
- **State**: Zustand (cart, language)
- **Images**: Sharp (WebP conversion)
- **Icons**: React Icons (Feather, Font Awesome)
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB instance (local or Atlas)

### Environment Variables
Create `.env.local`:
```
MONGODB_URI=mongodb+srv://your-connection-string
ADMIN_SECRET=your-secret-key-for-jwt
```

### Installation
```bash
npm install
npm run dev
```

### Seed Admin Account
Visit `http://localhost:3000/api/seed` to create the default admin:
- **Username**: `admin`
- **Password**: `admin123`

Change the password after first login.

### Logo
Replace `public/logo.png` with your actual store logo.

## Deployment on Plesk

### 1. Prepare the Server
```bash
# SSH into your server
# Install Node.js 20+ via Plesk > Extensions > Node.js
# Create a MongoDB database or use MongoDB Atlas
```

### 2. Upload Files
- Upload the project to your domain's document root via Plesk File Manager or Git
- Or use Git: push to a repo and clone on the server

### 3. Configure Node.js in Plesk
1. Go to **Domains > your-domain > Node.js**
2. Set **Node.js version**: 20+
3. Set **Document root**: `/httpdocs` (or your project folder)
4. Set **Application root**: same as document root
5. Set **Application startup file**: `node_modules/.bin/next`
6. Set **Application mode**: `production`

### 4. Set Environment Variables
In Plesk Node.js settings, add:
```
MONGODB_URI=your-mongodb-uri
ADMIN_SECRET=your-secret-key
NODE_ENV=production
```

### 5. Build & Start
```bash
cd /var/www/vhosts/your-domain/httpdocs
npm install --production=false
npm run build
# Plesk will handle starting the app via PM2
```

### Alternative: PM2 Deployment
```bash
npm install -g pm2
npm run build
pm2 start npm --name "areej" -- start
pm2 save
pm2 startup
```

### 6. Nginx Proxy (if needed)
Add to your Nginx config in Plesk:
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## Project Structure
```
src/
  app/
    (store)/          # Frontend pages
      page.tsx        # Homepage
      products/       # Product listing & detail
      checkout/       # Checkout page
      thank-you/      # Order confirmation
    admin/
      page.tsx        # Admin login
      dashboard/
        page.tsx      # Dashboard
        invoices/     # Invoice management
        products/     # Product management
        orders/       # Order management
        customers/    # Customer loyalty
        settings/     # Store settings
    api/              # API routes
  components/         # Shared components
  i18n/               # Translation strings
  lib/                # DB connection, auth, utils
  models/             # Mongoose models
  store/              # Zustand stores
```
