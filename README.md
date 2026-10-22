# MotoTech

Motorcycle parts and accessories shop for ITCP318. Layout matches the class repo: `backend` for the API and `frontend` for the React app.

The storefront uses React, Bootstrap, and custom CSS. The admin area uses Material UI. The API uses Express and MongoDB. Photos go to Cloudinary, login uses Firebase Authentication, and order updates send an email with a PDF receipt.

## Run it

Use two terminals, same as [the class project](https://github.com/m3lfx/itcp318-s3a-2026).

1. Copy `backend/config/.env.example` to `backend/config/.env`.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Fill in MongoDB, Cloudinary, Firebase, and SMTP values. Set `ADMIN_EMAIL` to the email you will register as the administrator.

**API**

```bash
cd backend
npm install
npm run dev
```

**Shop**

```bash
cd frontend
npm install
npm run dev
```

The shop opens at http://localhost:5173 and the API at http://localhost:5000.

Register the admin email with username and password. That account becomes an admin. You can also promote any existing account from `backend`:

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
