# SynapX - Multi-Disease Prediction System

SynapX is a multi-disease prediction platform for heart disease, diabetes, breast cancer, and lung cancer. It combines a React frontend, an Express backend, MongoDB, and machine learning models to provide prediction workflows, image uploads, prescription parsing, and downloadable PDF reports.

## Features

- User authentication with protected prediction routes.
- Heart disease prediction using Logistic Regression.
- Diabetes prediction using Support Vector Machine (SVM).
- Breast cancer prediction using a Convolutional Neural Network (CNN).
- Lung cancer prediction using an InceptionResNet model.
- Medical image upload support for cancer predictions.
- Prescription upload support for heart disease and diabetes form filling.
- Downloadable custom PDF reports.
- Single server deployment using Node.js child processes for model execution.

## Tech Stack

- Frontend: React, Vite, Context API, React Toastify.
- Backend: Node.js, Express.js, MongoDB, Mongoose.
- Machine Learning: Logistic Regression, SVM, CNN, InceptionResNet.
- Utilities: `pdf-lib`, `multer`, `concurrently`.

## Setup

1. Install backend dependencies:

```bash
cd Backend
npm install
```

2. Create the backend environment file:

```bash
cp .env.example .env
```

3. Update `Backend/.env` with your MongoDB URI, token secrets, allowed frontend origin, and Cloudinary keys if image uploads require Cloudinary.

4. Install frontend dependencies:

```bash
cd ../Frontend
npm install
```

5. Start the full app from the backend directory:

```bash
cd ../Backend
npm run dev
```

## Environment Variables

The backend reads variables from `Backend/.env`.

```env
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
ACCESS_TOKEN_SECRET=replace-with-a-long-random-access-token-secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=replace-with-a-long-random-refresh-token-secret
REFRESH_TOKEN_EXPIRY=10d
GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

The frontend reads variables from `Frontend/.env`.

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
```

Use the same Google OAuth web client ID in both env files.

## Vercel Deployment

Deploy the backend and frontend as two Vercel projects.

Backend project:

- Root directory: `Backend`
- Build command: leave empty
- Output directory: leave empty
- Install command: `npm install`
- Environment variables: copy values from `Backend/.env.example`
- Set `CORS_ORIGIN` to the deployed frontend URL, for example `https://synapx.vercel.app`
- Set `NODE_ENV=production`

Frontend project:

- Root directory: `Frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: copy values from `Frontend/.env.example`
- Set `VITE_API_BASE_URL` to the deployed backend URL, for example `https://synapx-api.vercel.app`

Google OAuth:

- Add the deployed frontend URL to Google OAuth Authorized JavaScript origins.
- Keep the same OAuth web client ID in `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.

## Usage

1. Sign up or log in.
2. Choose a predictor from the Predictors page.
3. Enter medical values manually, upload a prescription where supported, or upload an image for cancer prediction.
4. Submit the form to view the prediction result.
5. Download the generated PDF report when needed.

## Project Structure

```text
SynapX/
|-- Backend/                 Backend API and model execution
|   |-- controllers/         Request handlers
|   |-- DataScrapingScripts/ Prescription parsing scripts
|   |-- db/                  Database connection
|   |-- middlewares/         Express middleware
|   |-- models/              Mongoose models
|   |-- routes/              API route definitions
|   |-- utils/               Shared backend utilities
|   |-- app.js               Express app setup
|   |-- constants.js         Shared constants
|   |-- index.js             Server entry point
|   |-- .env.example         Environment template
|   `-- uploads/             Runtime uploads
|-- Frontend/                React application
|   |-- public/              Public assets and report templates
|   `-- src/                 Components, pages, context, assets, and styles
|-- Medical Reports/         Sample medical reports and datasets
|-- ML/                      Machine learning models and scripts
|-- Screenshots/             Application screenshots
|-- LICENSE
`-- README.md
```

## Future Enhancements

- OCR support for more reliable prescription extraction.
- Additional disease predictors.
- Improved image preprocessing for cancer detection.
- Wearable data integration for richer health signals.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
