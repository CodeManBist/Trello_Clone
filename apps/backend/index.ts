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

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use("/api", invitationRoutes);
app.use("/api", boardRoutes);
app.use("/api", sectionRoutes);
app.use("/api", issueRoutes);
app.use("/api", commentRoutes);
app.use("/api", chatRoutes);

app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');  
});
