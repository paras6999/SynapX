import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { heartScraper } from '../controllers/pdf.controller.js';
import { diabetesScraper } from '../controllers/pdf.controller.js';

const router = express.Router();
const uploadDir = process.env.VERCEL === '1' ? os.tmpdir() : path.resolve('uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
            return;
        }

        cb(new Error('Only PDF files are allowed'));
    },
});

router.post('/heart-scraper', upload.single('pdfFile'), heartScraper);

// Route for diabetes prediction
router.post('/diabetes-scraper', upload.single('pdfFile'), diabetesScraper);

export default router;
