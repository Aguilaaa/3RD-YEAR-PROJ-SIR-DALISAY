# MotoTech

Motorcycle parts and accessories shop for ITCP318. The storefront uses React, Bootstrap, and custom CSS. The admin area uses Material UI. The API uses Express and MongoDB. Photos go to Cloudinary, login uses Firebase Authentication, and order updates send an email with a PDF receipt.

The project follows the class layout: `backend` for the API and `frontend` for the React app.

## Run it

1. Install [MongoDB Community](https://www.mongodb.com/try/download/community) or use an Atlas connection string.
2. Copy `backend/config/.env.example` to `backend/config/.env` and `frontend/.env.example` to `frontend/.env`.
3. Fill in MongoDB, Cloudinary, Firebase, and SMTP values. Set `ADMIN_EMAIL` to the email you will register as the administrator.
4. From this folder:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev
```

The shop opens at http://localhost:5173 and the API at http://localhost:5000.

Register the admin email with username and password. That account becomes an admin. You can also promote any existing account:

```bash
npm run make-admin -- you@email.com
```

Google sign-in always creates a customer. Sample categories, motorcycle models, and products are added the first time the API starts.

## What maps to the course

| Area | Where it lives |
| --- | --- |
| MP1 product CRUD, Cloudinary photos, DataTables, bulk delete | Admin → Products |
| MP2 registration, Firebase login, profile photo | Register, Login, Profile |
| MP3 reviews and ratings | Product page and Admin → Reviews |
| Bad-word masking | Review save, `bad-words` on the server |
| Form validation | Yup with Formik on registration and React Hook Form everywhere else |
| Cart, checkout, status email, PDF receipt | Cart, Checkout, Admin → Orders |
| Price, category, and rating filters | Shop homepage |
| Monthly line chart and date-range bar chart | Admin → Dashboard and Sales |
| Pagination and infinite scroll | Shop homepage toggle |
| Google login | Login and Register, Firebase Authentication |
