# Certificate Generator

An automated Certificate Generator and Dispatcher application with an Express backend and React (Vite) frontend.

## Features
- **Excel/CSV Upload**: Batch import candidate names and emails.
- **Certificate Template Rendering**: Dynamic certificate generation using Node Canvas.
- **Bulk Email Dispatching**: Automated certificate delivery via Nodemailer with Gmail.
- **ZIP Download**: Download all generated certificates in a single compressed archive.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS / CSS Modules, Axios
- **Backend**: Node.js, Express, Canvas, Adm-Zip, Nodemailer, XLSX

## Setup & Running

### Backend
1. Open terminal in `backend`:
   ```bash
   cd backend
   npm install
   ```
2. Create `.env` based on `.env.example`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   PORT=5000
   ```
3. Start the server:
   ```bash
   npm start
   ```

### Frontend
1. Open terminal in `frontend`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
