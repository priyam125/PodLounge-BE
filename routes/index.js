import { Router } from "express";
import AuthRoutes from "./authRoute.js";
import ActivateRoutes from "./activateRoute.js";

const router = Router();

router.use("/api", AuthRoutes);
router.use("/api", ActivateRoutes);

export default router;
