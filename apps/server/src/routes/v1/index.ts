import { Router } from "express";

import profileRouter from "./profile.js";

const v1Router: Router = Router();

v1Router.use("/profile", profileRouter);

export default v1Router;
