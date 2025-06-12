
# 🍰 Final Project Backend - Bakey API

## Overview

Final Project is a full-stack application for managing and sharing cake products and recipes. Users can register, log in (manually or via Google), create and manage recipes, orders, and products. The backend is developed using Node.js, Express, and TypeScript with a robust CI/CD pipeline and production deployment strategy.

---

## 🔧 Features

- ✅ JWT and Google OAuth2 authentication
- 📦 Product and recipe management (CRUD)
- 🛒 Order handling with item tracking
- 🔐 Secure password storage using `bcrypt`
- 🧾 API documentation via Swagger
- 📸 Image upload via Cloudinary
- 🧪 Testing with Jest
- 🧹 Linting and type-checking in CI
- 🚀 PM2-managed deployment with CI/CD

---

## 🛠️ Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (Mongoose)
- **Auth:** Passport.js, JWT, Google OAuth2
- **Tools:** dotenv, multer, Cloudinary, Swagger
- **DevOps:** GitHub Actions, PM2, SSH deployment

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── common/
│   └── server.ts
├── dist/
├── tests/
├── package.json
├── tsconfig.json
└── .env
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/barmor12/FinalProject-backend.git
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/myDatabase
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
```

### 4. Run the app

For development:

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

---

## 🧪 Testing and Linting

```bash
npm run lint        # Check lint rules
npm run test        # Run tests with Jest
npx tsc --noEmit    # Type check only
```

---

## ⚙️ CI/CD Pipeline

- Triggered on pushes to `main` and `develop`
- Runs lint, type-check, and tests
- If successful, SSH to server and:
  - Pulls latest code
  - Installs dependencies
  - Restarts backend using PM2

> **Note:** Private SSH key is stored in GitHub secrets and decoded at runtime.

---

## 📦 Deployment Commands (PM2)

```bash
pm2 start dist/server.js --name CakeBackend
pm2 restart CakeBackend
pm2 logs CakeBackend
```

---

## ✍️ Authors

Developed by **Bar Mor** & **Aviel Esperansa**

---

## 🪪 License

Licensed under the MIT License.
