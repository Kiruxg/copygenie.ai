require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();
const port = process.env.PORT || 3000;

// Custom CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5501");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set to true if using https
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/copygenie", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Basic User Model
const User = mongoose.model("User", {
  email: String,
  googleId: String,
  plan: { type: String, default: "free" },
  generationsCount: { type: Number, default: 0 },
});

// Passport config
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Auth Routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => res.redirect("/")
);

// Description Generation Route
app.post("/api/generate", async (req, res) => {
  try {
    const { productName, personality } = req.body;
    const user = req.user;

    // Check user limits
    if (user && user.plan === "free" && user.generationsCount >= 5) {
      return res.status(403).json({ error: "Free tier limit reached" });
    }

    // Your generation logic here
    const description = `Generated description for ${productName} in ${personality} style`;

    // Update user's generation count
    if (user) {
      await User.findByIdAndUpdate(user.id, { $inc: { generationsCount: 1 } });
    }

    res.json({ success: true, description });
  } catch (error) {
    res.status(500).json({ error: "Generation failed" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
