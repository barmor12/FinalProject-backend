import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "./models/userModel"; // ודא שהנתיב נכון
import dotenv from "dotenv";

// טוען את משתני הסביבה
dotenv.config();

// הגדרת Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!, // חובה לספק clientID
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // חובה לספק clientSecret
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback", // URL ברירת מחדל
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Profile received from Google:", profile); // לוג לדיבוג

        // חיפוש משתמש לפי Google ID
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // יצירת משתמש חדש אם לא נמצא
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails ? profile.emails[0].value : undefined,
            profilePic: profile.photos ? profile.photos[0].value : undefined,
          });
          await user.save();
          console.log("New user created:", user);
        }

        // הצלחה
        return done(null, user);
      } catch (err) {
        console.error("Error during authentication:", err);
        return done(err, false);
      }
    }
  )
);

// סריאליזציה של המשתמש
passport.serializeUser((user, done) => {
  done(null, (user as any)._id); // שומר את מזהה המשתמש בלבד
});

// דה-סריאליזציה של המשתמש
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error("Error during deserialization:", err);
    done(err, null);
  }
});

export default passport;
