import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/user/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(null, false, {
            message: "Google account has no email address.",
          });
        }

        let user = await User.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
          }
          if (!user.name) {
            user.name =
              profile.displayName || profile.name?.givenName || "Google User";
          }
          if (!user.profileImage && profile.photos?.[0]?.value) {
            user.profileImage = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        const randomPassword = `${Date.now()}-${Math.random().toString(36).slice(2)}-Quickart`;
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await User.create({
          name: profile.displayName || profile.name?.givenName || "Google User",
          email,
          googleId: profile.id,
          password: hashedPassword,
          profileImage: profile.photos?.[0]?.value || "",
          role: "user",
        });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
