import express from 'express';
import { runSeed } from '../controllers/seedController.js';

const router = express.Router();

// Public endpoint: GET /seed?password=YOUR_PASSWORD
router.get('/', runSeed);

export default router;
