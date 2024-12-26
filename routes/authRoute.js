import { Router } from 'express';
import AuthController from '../controller/AuthController.js';
// import { verifyToken } from '../middleware/AuthMiddleware.js';

const router = Router()

router.post('/auth/send-otp', AuthController.sendOtp);
router.post('/auth/verify-otp', AuthController.verifyOtp);
router.get('/auth/refresh-token', AuthController.refreshToken)

// module.exports = router;
export default router