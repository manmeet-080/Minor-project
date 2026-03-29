import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import * as ctrl from './audit-logs.controller.js';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.list);

export default router;
