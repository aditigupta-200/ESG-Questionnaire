import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import responseRoutes from "./routes/responses.js";

dotenv.config();

const app = express();
app.use(cors({ origin: [ "http://localhost:3000" ], credentials: false }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/responses", responseRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
