import { Router } from "express";

import onboardingRouter from "./onboarding.js";
import checkinsRouter from "./checkins.js";
import journalRouter from "./journal.js";
import memoryRouter from "./memory.js";
import profileRouter from "./profile.js";
import chatRouter from "./chat.js";
import linkedinRouter from "./linkedin.js";
import marketRouter from "./market.js";

const v1Router: Router = Router();

v1Router.use("/onboarding", onboardingRouter);
v1Router.use("/profile", profileRouter);
v1Router.use("/journal", journalRouter);
v1Router.use("/checkins", checkinsRouter);
v1Router.use("/memory", memoryRouter);
v1Router.use("/chat", chatRouter);
v1Router.use("/linkedin", linkedinRouter);
v1Router.use("/market", marketRouter);

export default v1Router;
