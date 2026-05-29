import { Router } from "express";

import onboardingRouter from "./onboarding.js";
import profileRouter from "./profile.js";

const v1Router: Router = Router();

v1Router.use("/onboarding", onboardingRouter);
v1Router.use("/profile", profileRouter);

export default v1Router;
