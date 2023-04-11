import { Router } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../database';
import { User } from '@prisma/client';

const router = Router();

router.get('/', (req: any, res): void => {
  if (req.session?.user) {
    res.json({ user: req.session.user });
  }
  res.json({ user: null });
});

router.post('/login', async (req: any, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (!user) {
      res.json({ message: 'User not found', auth: false });
    } else {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        req.session.user = user;
        res.json({ message: 'Logged in', auth: true });
      } else {
        res.json({ message: 'Wrong password', auth: false });
      }
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      res.json({ message: e.message, auth: false });
    } else {
      res.json({ message: 'Unknown error', auth: false });
    }
  }
});

router.post('/register', async (req: any, res) => {
  const { userName, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = await prisma.user.create({
      data: {
        userName,
        email,
        password: hashedPassword,
      },
    });
    req.session.user = { ...user };
    res.json({ user: user });
  } catch (e: unknown) {
    if (e instanceof Error) {
      res.json({ message: e.message, auth: false });
    } else {
      res.json({ message: 'Unknown error', auth: false });
    }
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.json({ message: err.message });
    } else {
      res.clearCookie('auth');
      res.json({ message: 'Logged out', user: null });
    }
  });
});

export default router;
