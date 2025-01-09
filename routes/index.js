import { Router } from "express";
import AuthRoutes from "./authRoute.js";
import ActivateRoutes from "./activateRoute.js";
import RoomRoutes from "./roomsRoute.js";

const router = Router();

router.use("/api", AuthRoutes);
router.use("/api", ActivateRoutes);
router.use("/api", RoomRoutes);

export default router;
