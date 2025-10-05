# ADVENTUREApi

A **Backend API** inspired by [Jonas Schmedtmann's Node.js API course](https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/), reimagined and enhanced for a portfolio project.  
ADVENTUREApi allows customers to search for and book various adventure tours, while demonstrating professional backend design patterns, validation, and error handling.

---

## Features

- Full **CRUD** operations for tours and users
- **Advanced filtering, sorting, and pagination** for tours
- **Zod validation** for request data (sanitization and type safety)
- **Mongoose schema validations** for database integrity
- **Centralized error handling** with custom `AppError` and global middleware
- **Duplicate key and validation errors** properly handled
- **Security features**:
  - Input sanitization to prevent NoSQL injection
  - CORS and Helmet headers
  - Rate limiting
- **JWT-based authentication** (optional feature to demonstrate secure routes)
- **Aggregations and virtuals** for enhanced tour analytics

---

## Technologies

- Node.js & Express
- MongoDB & Mongoose
- Zod for input validation
- JWT for authentication (optional)
- Thunder Client for API testing

---

## Getting Started

### Requirements

- Node.js v18+
- MongoDB (local or cloud)
- npm / yarn

### Installation

1. Clone the repo:

   ```bash
   git clone https://github.com/Lokacitron123/Tours-API.git
   ```

2. cd adventure-api:

   ```bash
   npm install
   ```

3. Create a .env file:

   ```bash
     PORT=3000
     MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/adventure
     JWT_SECRET=your_jwt_secret
     JWT_EXPIRES_IN=90d
   ```

4. Start the server:

   ```bash
   npm run dev
   ```
