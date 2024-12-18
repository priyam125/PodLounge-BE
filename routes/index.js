import { Router } from "express";
import AuthRoutes from "./authRoute.js";

const router = Router();

router.use("/api", AuthRoutes);

export default router;
