# Jobify
# 🌐 Jobify Backend (Node.js + Express)

This is the backend API for the Jobify mobile application. It handles user registration and authentication, job CRUD operations,User CRUD, Job Application CRUD,Jib SAved CRUD, resume file uploads, and database interactions using MySQL and Knex.js.

---

## ⚙️ Tech Stack

- Node.js + Express
- MySQL (via Knex.js)
- JWT Authentication
- RESTful APIs
- bcrypt for password hashing
- Multer for file uploads

---

## 🚀 Setup Instructions

Follow the steps below to set up the backend server:
Create a folder:


### . Clone the Repository
```bash
git clone https://github.com/BismaSahr/FirstApp_Backend-


 ### 📦 Install Dependencies
```bash
npm init -y
npm install express mysql2 knex dotenv bcrypt jsonwebtoken multer

```.env
DB_HOST=YourHost
DB_USER=YourUser
DB_PASSWORD=yourpassword
DB_NAME=Your_db_Name
PORT=Your_Port
JWT_SECRET=jwt_secret



📁 Run Database Migrations
npx knex migrate:latest

🚀 Start Backend Server
npm start

