import { Router } from 'express';
import { verifyToken } from '../middlewares/auth-middleware.js';
import RoomController from '../controller/RoomController.js';

const router = Router()

router.post('/rooms/create-room', verifyToken, RoomController.createRoom);
router.get('/rooms/get-all-rooms', verifyToken, RoomController.getAllRooms);


export default router