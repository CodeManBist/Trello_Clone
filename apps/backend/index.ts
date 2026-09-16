import express from 'express';
import cors from 'cors';
import { prisma } from 'db/client';

import authRoutes from './routes/auth.routes.ts';
import organizationRoutes from './routes/organization.routes.ts';   
import invitationRoutes from './routes/invitation.routes.ts';
import boardRoutes from './routes/board.routes.ts';
import sectionRoutes from "./routes/section.routes";
import issueRoutes from "./routes/issue.routes";
import commentRoutes from "./routes/comment.routes";
import chatRoutes from "./routes/chat.routes.ts";

const app = express();

app.use(express.json());

app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    })
);

app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        message: "Backend is running",
    });
  });

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use("/api", invitationRoutes);
app.use("/api", boardRoutes);
app.use("/api", sectionRoutes);
app.use("/api", issueRoutes);
app.use("/api", commentRoutes);
app.use("/api", chatRoutes);

const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});

server.on("error", (err) => {
  console.error("SERVER ERROR:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});
