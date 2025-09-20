import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { storage } from "./storage.js";

const scryptAsync = promisify(scrypt);
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable is required in production');
    process.exit(1);
  } else {
    console.warn('WARNING: Using default JWT_SECRET for development');
    JWT_SECRET = 'VantaTrack2025SecureJWTSecretForBangladeshAdEngine!';
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64));
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || (() => {
      console.error('FATAL: SESSION_SECRET environment variable is required');
      process.exit(1);
    })(),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password login
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.passwordHash))) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          if (!user.isActive) {
            return done(null, false, { message: 'Account is inactive' });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // JWT strategy for API authentication
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await storage.getUser(payload.userId);
          if (user && user.isActive) {
            return done(null, user);
          }
          return done(null, false);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Public registration disabled - VantaTrack now uses invite-only onboarding
  // Registration is handled through the admin invite system only

  // Login endpoint
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || "Authentication failed" });
      }

      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Log user login activity
        try {
          await storage.logUserActivity(
            user.id,
            req.ip || req.connection.remoteAddress,
            req.get('User-Agent') || 'Unknown',
            'password'
          );
        } catch (logError) {
          console.error('Error logging user activity:', logError);
          // Don't fail the login if activity logging fails
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({ 
          user: { ...user, passwordHash: undefined },
          token
        });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/user", requireAuth, (req, res) => {
    res.json({ ...req.user, passwordHash: undefined });
  });

  // Middleware to require authentication (JWT-only for API security)
  function requireAuth(req, res, next) {
    // Use JWT-only authentication for APIs to eliminate CSRF risks
    passport.authenticate('jwt', { session: false })(req, res, (err) => {
      if (err) return next(err);
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      next();
    });
  }

  // Middleware to require specific role
  function requireRole(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  }

  return { requireAuth, requireRole };
}

export { hashPassword, comparePasswords };