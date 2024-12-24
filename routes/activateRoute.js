import { Router } from 'express';
import ActivateController from '../controller/ActivateController.js';
import { verifyToken } from '../middlewares/auth-middleware.js';


const router = Router()

router.post('/activate', verifyToken, ActivateController.activate);


// module.exports = router;
export default router