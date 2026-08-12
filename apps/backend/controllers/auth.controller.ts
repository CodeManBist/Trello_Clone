import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';   
import { prisma } from 'db/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export async function signup(req: Request, res: Response) {
    const { username, email, password } = req.body;

    if(!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if(existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword
        }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ 
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email
        }
    });
}

export async function signin(req: Request, res: Response) {
    const { email, password } = req.body;

    if(!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if(!existingUser) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);

    if(!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: existingUser.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ 
        token,
        user: {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email
        }
    });
}