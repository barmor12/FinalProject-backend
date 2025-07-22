// @ts-nocheck
import request from 'supertest';
import express from 'express';
import * as User from '../models/userModel';
import { OAuth2Client } from 'google-auth-library';

const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
  };
});

import * as authController from '../controllers/authController';

const app = express();
app.use(express.json());
app.post('/auth/google', authController.googleCallback);
app.post('/auth/register', authController.register);
app.post('/auth/login', authController.login);
app.get('/auth/verify-email', authController.verifyEmail);
app.post('/auth/forgot-password', authController.forgotPassword);
app.post('/auth/reset-password', authController.resetPassword);

const mockSave = jest.fn();
const mockUser = {
  _id: 'user123',
  email: 'test@example.com',
  role: 'user',
  googleId: 'google-id-123',
  profilePic: { url: '', public_id: '' },
  refresh_tokens: [],
  password: '$2a$10$HashedPass',
  isVerified: true,
  phone: '+1234567890',
  save: mockSave,
};

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('googleCallback', () => {
    it('should create a new user when not found', async () => {
      jest
        .spyOn(User.default, 'findOne')
        .mockResolvedValueOnce(null) // googleId not found
        .mockResolvedValueOnce(null); // email not found
      User.default.prototype.save = mockSave.mockResolvedValue(mockUser);

      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => ({ email: 'test@example.com', sub: 'google-id-123' }),
      });

      const res = await request(app)
        .post('/auth/google')
        .send({ id_token: 'valid-token', password: '123456', phone: '+1234567890' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('userId');
    });

    it('should login existing user by googleId', async () => {
      jest.spyOn(User.default, 'findOne').mockResolvedValueOnce(mockUser); // found by googleId

      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => ({ email: 'test@example.com', sub: 'google-id-123' }),
      });

      const res = await request(app).post('/auth/google').send({
        id_token: 'valid-token',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('userId', 'user123');
    });
    it('should return 400 if email is missing', async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => ({ sub: 'id-only' }),
      });

      const res = await request(app)
        .post('/auth/google')
        .send({ id_token: 'missing-email' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'error',
        'Google account must have an email'
      );
    });
    it('should return 500 if Google token is invalid', async () => {
      mockVerifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

      const res = await request(app).post('/auth/google').send({
        id_token: 'invalid-token',
      });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error', 'Failed to authenticate user');
    });
  });

  describe('register', () => {
    it('should fail if required fields are missing', async () => {
      const res = await request(app).post('/auth/register').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'All fields are required');
    });

    it('should fail if password is too weak', async () => {
      const res = await request(app).post('/auth/register').send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: '123',
        phone: '+1234567890',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Password must include/);
    });

    it('should return 400 if user already exists', async () => {
      jest.spyOn(User.default, 'findOne').mockResolvedValue(mockUser);
      const res = await request(app).post('/auth/register').send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '+1234567890',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty(
        'error',
        'User with this email already exists'
      );
    });
  });

  describe('login', () => {
    it('should return error if email or password missing', async () => {
      const res = await request(app).post('/auth/login').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'error',
        'Email and password are required'
      );
    });

    it('should return error if user is not found', async () => {
      jest.spyOn(User.default, 'findOne').mockResolvedValue(null);
      const res = await request(app).post('/auth/login').send({
        email: 'notfound@example.com',
        password: 'Password123!',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should login existing user with correct password', async () => {
      jest.spyOn(User.default, 'findOne').mockResolvedValue({
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
      });

      // Patch bcrypt.compare to always return true for this test
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      const res = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.tokens).toHaveProperty('accessToken');
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email if token is valid', async () => {
      const mockToken = require('jsonwebtoken').sign(
        { userId: 'user123' },
        process.env.EMAIL_SECRET!
      );

      jest.spyOn(User.default, 'findById').mockResolvedValueOnce({
        isVerified: false,
        save: jest.fn(),
      });

      const res = await request(app).get(
        `/auth/verify-email?token=${mockToken}`
      );
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('Your email has been successfully verified');
    });

    it('should return error for invalid token', async () => {
      const res = await request(app).get(
        '/auth/verify-email?token=invalid-token'
      );
      expect(res.statusCode).toBe(400);
      expect(res.text.toLowerCase()).toContain('invalid or expired token');
    });
  });

  describe('forgotPassword', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app).post('/auth/forgot-password').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email is required');
    });

    it('should return 404 if user not found', async () => {
      jest.spyOn(User.default, 'findOne').mockResolvedValue(null);
      const res = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' });
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });

    it('should send reset code if user exists', async () => {
      // Skip mocking internal function, just test overall response
      jest.spyOn(User.default, 'findOne').mockResolvedValueOnce({
        email: 'test@example.com',
        save: jest.fn(),
      });

      const res = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Reset code sent to email');
    });
  });

  describe('resetPassword', () => {
    it('should return 400 if any field is missing', async () => {
      const res = await request(app).post('/auth/reset-password').send({});
      expect(res.statusCode).toBe(400);
    });

    it('should return 404 if user not found', async () => {
      jest.spyOn(User.default, 'findOne').mockResolvedValue(null);
      const res = await request(app).post('/auth/reset-password').send({
        email: 'notfound@example.com',
        code: '123456',
        newPassword: 'Password123!',
      });
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });

    it('should return 400 for invalid or expired reset code', async () => {
      jest.spyOn(User.default, 'findOne').mockResolvedValue({
        resetToken: '000000',
        resetExpires: new Date(Date.now() - 1000),
      });

      const res = await request(app).post('/auth/reset-password').send({
        email: 'test@example.com',
        code: '123456',
        newPassword: 'Password123!',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid or expired reset code');
    });

    it('should reset password with valid code', async () => {
      const save = jest.fn();
      const user = {
        resetToken: '123456',
        resetExpires: new Date(Date.now() + 1000 * 60),
        save,
      };
      jest.spyOn(User.default, 'findOne').mockResolvedValue(user);
      jest.spyOn(User.default, 'updateOne').mockResolvedValue({});

      const res = await request(app).post('/auth/reset-password').send({
        email: 'test@example.com',
        code: '123456',
        newPassword: 'Password123!',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Password reset successfully');
    });
  });
});
