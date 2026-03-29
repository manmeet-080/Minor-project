import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import * as ctrl from './reports.controller.js';

const router = Router();

router.get('/dashboard/:hostelId', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.dashboard);
router.get('/occupancy/:hostelId', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.occupancy);
router.get('/fees/:hostelId', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.fees);
router.get('/complaints/:hostelId', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.complaints);
router.get('/revenue-trend/:hostelId', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.revenueTrend);
router.get('/gate-passes/:hostelId', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.gatePasses);
router.get('/visitors/:hostelId', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.visitors);
router.get('/mess/:hostelId', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.mess);
router.get('/login-activity/:hostelId', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.loginActivity);

export default router;
