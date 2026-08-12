import express from 'express';
import { prisma } from 'db/client';
import authRoutes from './routes/auth.routes.ts';
import organizationRoutes from './routes/organization.routes.ts';   
import invitationRoutes from './routes/invitation.routes.ts';
import boardRoutes from './routes/board.routes.ts';

const app = express();

app.use(express.json());

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use("/api", invitationRoutes);
app.use("/api", boardRoutes);

app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');  
});