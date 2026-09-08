import express, { type Express } from "express";
import legacyApp from "../app.js";
import { enforceOriginLock } from "./middleware/originLock.js";

const app: Express = express();
app.use(enforceOriginLock);
app.use(legacyApp);

export default app;
