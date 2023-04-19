import { Router } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../database';
import { User, Statistic} from '@prisma/client';
import { sendMessage } from '../nodemailer/nodemailer';

const router = Router();


router.get('/', (req, res): void => {
  console.log('session ===> ' , req.session);
  if (req.session?.user) {
    res.json({ user: req.session.user });
    return;
  } 
  else if(req.session?.passport){
    res.json({ user: req.session.passport.user })
    return;
  }
  res.json({ user: null });
});

router.post('/login', async (req, res) => {
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
        res.json({ user: user });
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

router.post('/register', async (req, res) => {
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
    req.session.user = user;
    sendMessage(email);
    
    res.json({ user: user });
  } catch (e: unknown) {
    console.log(e);
    
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
      res.json({ user: null });
    }
  });
});

router.get('/statistic', async (req, res) => {
  const playerId = req.session.user?.id || req.session.passport.id
  try {
    const statistic = await prisma.statistic.findMany({where: {
      playerId,
    }
  })
    res.json({statistic: statistic})
  } catch (e: unknown) {
    console.log(e);
  }
});

export default router;
