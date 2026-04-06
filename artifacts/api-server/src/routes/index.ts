import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import tasksRouter from "./tasks";
import vatRouter from "./vat";
import corporateTaxRouter from "./corporate-tax";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(clientsRouter);
router.use(tasksRouter);
router.use(vatRouter);
router.use(corporateTaxRouter);
router.use(usersRouter);

export default router;
