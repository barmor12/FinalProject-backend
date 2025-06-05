module.exports = {
  apps: [
    {
      name: "CakeBackend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        MONGO_URI:
          "mongodb+srv://cakemanagmentpro:MzylM633tLcURB7n@cluster0.burwp.mongodb.net/test?retryWrites=true&w=majority",
        GOOGLE_CLIENT_ID: "your-google-client-id",
        GOOGLE_CLIENT_SECRET: "your-google-client-secret",
        GOOGLE_CALLBACK_URL: "http://188.245.37.93:3000/auth/google/callback",
        ACCESS_TOKEN_SECRET: "1234567890abcdefadsfvbzxbzgzxvcvnbxcgxzvxb",
        REFRESH_TOKEN_SECRET: "0987654321abcdefsfgssfsgzsgvbfdghzdffsfxxzg",
        EMAIL_USER: "barmor123456@gmail.com",
        EMAIL_PASSWORD: "fryg atoo neih wfjz",
        EMAIL_SERVICE: "gmail",
        FRONTEND_URL: "http://localhost:3000",
        EMAIL_SECRET: "some-secret-for-email",
        JWT_TOKEN_EXPIRATION: "10d",
        JWT_REFRESH_TOKEN_EXPIRATION: "7d",
        CLOUDINARY_CLOUD_NAME: "dhhrsuudb",
        CLOUDINARY_API_KEY: "434521875261875",
        CLOUDINARY_API_SECRET: "jDuZc8M_ziJudnX-cLRixv9kdjU",
      },
    },
  ],
};
