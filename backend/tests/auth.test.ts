import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { register } from '../src/controllers/authController'; // נתיב אמיתי לפי הפרויקט שלך
import User from '../src/models/userModel';
import * as sendVerificationEmail from '../src/controllers/authController'; // לפעמים תצטרך למקם את ה-sendVerificationEmail כאן

// MOCK dependencies that shouldn't be called in real test
jest.mock('../src/utils/email', () => ({
    sendVerificationEmail: jest.fn(),
}));
jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload_stream: jest.fn((opts, cb) => ({
                end: () => cb(null, { secure_url: 'fake', public_id: 'fake' }),
            })),
        },
    },
}));

const app = express();
app.use(express.json());
app.post('/register', register);

describe('User registration', () => {
    beforeAll(async () => {
        // הפעל מנוע Mongo In-Memory (לבדיקות בלבד!)
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    });

    afterAll(async () => {
        await mongoose.connection.close();
        // אל תשכח לעצור את mongoServer אם אתה שומר reference אליו
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    it('fails if required fields are missing', async () => {
        const res = await request(app)
            .post('/register')
            .send({ firstName: 'Bar', lastName: 'Mor', email: '' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/all fields/i);
    });

    it('fails with weak password', async () => {
        const res = await request(app)
            .post('/register')
            .send({ firstName: 'Bar', lastName: 'Mor', email: 'test@test.com', password: 'weakpass' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/password must include/i);
    });

    it('fails if email already exists', async () => {
        // צור משתמש מראש
        await User.create({
            firstName: 'Bar',
            lastName: 'Mor',
            email: 'test@test.com',
            password: 'Abcde1234@',
            profilePic: {},
            role: 'user',
            isVerified: false,
        });

        const res = await request(app)
            .post('/register')
            .send({ firstName: 'Bar', lastName: 'Mor', email: 'test@test.com', password: 'Abcde1234@' });
        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/already exists/i);
    });

    it('registers a user successfully', async () => {
        const res = await request(app)
            .post('/register')
            .send({ firstName: 'Bar', lastName: 'Mor', email: 'bar@mor.com', password: 'Abcde1234@' });
        expect(res.status).toBe(201);
        expect(res.body.message).toMatch(/user created/i);
        expect(res.body.user.email).toBe('bar@mor.com');
        // וודא שלא מוחזר הסיסמה המקורית!
        expect(res.body.user.password).not.toBe('Abcde1234@');
    });
});