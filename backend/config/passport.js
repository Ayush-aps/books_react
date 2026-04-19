/**
 * Passport configuration for local authentication strategy
 */

const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");

const findUserByEmail = async (email) => {
  return User.findOne({ email }).select("name email role avatar isVerified +password");
};

const normalizeEmail = (email = "") => email.trim().toLowerCase();

module.exports = (passport) => {
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const normalizedEmail = normalizeEmail(email);

        // Match user
        let user = await findUserByEmail(normalizedEmail);

        // Gracefully handle a common typo when no exact email exists.
        if (!user && normalizedEmail.endsWith("@gamil.com")) {
          const correctedEmail = normalizedEmail.replace(/@gamil\.com$/i, "@gmail.com");
          user = await findUserByEmail(correctedEmail);
        }

        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // Match password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // Return user without password
        const userWithoutPassword = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
        };

        return done(null, userWithoutPassword);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
