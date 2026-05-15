import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import chatRouter from "./chat";
import quizzesRouter from "./quizzes";
import progressRouter from "./progress";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(chatRouter);
router.use(quizzesRouter);
router.use(progressRouter);

export default router;
