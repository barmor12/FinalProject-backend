import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// תצורת Multer לשמירת הקבצים
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads')); // תיקיית שמירת הקבצים
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// פונקציה לבדוק את סוג הקובץ
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']; // פורמטים מותרים
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // קובץ תקין
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed')); // סוג קובץ לא תקין
  }
};

// תצורה סופית של Multer עם בדיקת גודל וסוג
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // גודל קובץ מקסימלי: 5MB
  fileFilter: fileFilter,
});

export default upload;
