import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listResponses } from "../controllers/response.controller";

const router = Router()

// Responses
router.get('/',requireAuth, listResponses);

export default router