import passport from 'passport';
import { Strategy as GoogleStrategy, IProfile } from 'passport-google-oidc';
// import {GoogleStrategy} from 'passport-google-oauth2'
import { Router } from 'express';
import prisma from '../database';
import { FederatedCredential, User } from '@prisma/client';
import { error } from 'console';

const router = Router();
const googleStrategyMiddleware = new GoogleStrategy(
  {
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: '/oauth2/redirect/google',
    scope: ['profile'],
  },
  async function verify(issuer: any, profile: IProfile, done: any) {
    console.log('profile ===>', profile);

    try {
      const federatedCredential = await prisma.federatedCredential.findFirst({
        where: {
          provider: issuer,
          subject: profile.id,
        },
      });

      if (!federatedCredential) {
        const createdUser = await prisma.user.create({
          data: {
            userName: profile.displayName,
            email: profile.id,
            password: 's',
          },
        });

        const createdFederatedCredential =
          await prisma.federatedCredential.create({
            data: {
              userId: createdUser.id,
              provider: issuer,
              subject: profile.id,
            },
          });

        const user = {
          id: createdUser.id,
          name: profile.displayName,
        };

        return done(null, user);
      } else {
        const user = await prisma.user.findUnique({
          where: {
            id: federatedCredential.userId,
          },
        });

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      }
    } catch (err) {
      return done(err);
    }
  }
);

passport.use(googleStrategyMiddleware);
passport.serializeUser(function (user: any, cb) {
  console.log(user, '<====user');

  process.nextTick(function () {
    cb(null, { id: user.id, userName: user.userName });
  });
});

passport.deserializeUser(function (user: any, cb) {
  // console.log(user);

  process.nextTick(function () {
    return cb(null, user);
  });
});
router.get('/login/federated/google', passport.authenticate('google'));
router.get(
  '/oauth2/redirect/google',
  passport.authenticate('google', {
    successRedirect: 'http://localhost:5173/login',
    failureRedirect: '/login',
  })
);
export default router;
