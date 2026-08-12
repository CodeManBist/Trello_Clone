import express from 'express';
import { prisma } from 'db/client';
import authRoutes from './routes/auth.routes.ts';
import organizationRoutes from './routes/organization.routes.ts';   

const app = express();

app.use(express.json());

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);

app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');  
});