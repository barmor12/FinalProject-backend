# Final Project -Backend

## Overview

inal Project is a full-stack application for managing and sharing cake recipes. Users can register, log in, create, update, and delete recipes. It also supports Google OAuth for authentication.

---

## Features

- User authentication with JWT and Google OAuth.
- Recipe management: create, read, update, and delete recipes.
- Secure password storage using `bcrypt`.
- MongoDB as the database with `mongoose` for schema management.
- API documentation with Swagger.
- Fully implemented backend with TypeScript.

---

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB (Atlas or Local)
- **Authentication:** Passport.js (Google OAuth), JWT
- **Other Tools:**
  - `bcrypt` for password hashing
  - `multer` for file uploads (recipe images)
  - `dotenv` for environment variable management

---

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/barmor12/FinalProject-backend.git
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following:

   ```env
   PORT=3000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/myDatabase?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SESSION_SECRET=your_session_secret
   ```

4. **Compile TypeScript**

   ```bash
   npm run build
   ```

5. **Run the server**
   ```bash
   npm start
   ```

---

## Usage

### Endpoints

#### Authentication

- `POST /auth/register`: Register a new user
- `POST /auth/login`: Log in a user
- `GET /auth/profile`: Get user profile
- `GET /auth/google`: Redirect to Google OAuth
- `GET /auth/google/callback`: Google OAuth callback

#### Recipes

- `GET /recipes`: Get all recipes
- `GET /recipes/:id`: Get a recipe by ID
- `POST /recipes`: Create a new recipe (authenticated)
- `PUT /recipes/:id`: Update a recipe (authenticated)
- `DELETE /recipes/:id`: Delete a recipe (authenticated)

### Example .env File

```env
PORT=5000
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/recipesDB?retryWrites=true&w=majority
JWT_SECRET=mysecret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=my_session_secret
```

---

## Development

### Run in Development Mode

Use `ts-node-dev` to run the server in development mode:

```bash
npm run dev
```

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run the server
- `npm run dev`: Run the server in development mode

---

## Folder Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── recipeController.ts
│   ├── models/
│   │   ├── userModel.ts
│   │   ├── recipeModel.ts
│   ├── routes/
│   │   ├── authRoute.ts
│   │   ├── recipeRoute.ts
│   ├── common/
│   │   ├── authMiddleware.ts
│   ├── server.ts
│   ├── passport.ts
├── dist/
├── .env
├── package.json
├── tsconfig.json
```

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

This project is licensed under the MIT License.

# 🍰 Final Project Backend - CakeManager API

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