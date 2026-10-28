import multer from 'multer';
const storage = multer.memoryStorage();
const fileFilter = (req, file, callback) => callback(null, ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype));
export const uploadResume = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('resume');
