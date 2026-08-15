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

const app = express();

app.use(express.json());

app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use("/api", invitationRoutes);
app.use("/api", boardRoutes);
app.use("/api", sectionRoutes);
app.use("/api", issueRoutes);
app.use("/api", commentRoutes);

app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');  
});
