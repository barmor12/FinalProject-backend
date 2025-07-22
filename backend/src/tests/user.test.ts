import request from 'supertest';
import express from 'express';
import userController from '../controllers/userController';
import jwt from 'jsonwebtoken';

jest.mock('../models/userModel', () => ({
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock('../config/cloudinary', () => ({
  uploader: {
    destroy: jest.fn(),
    upload: jest.fn(() => ({
      secure_url: 'http://example.com/image.jpg',
      public_id: 'mockPublicId',
    })),
  },
}));

const mockUser = {
  _id: 'user123',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890',
  profilePic: {
    url: 'http://example.com/old.jpg',
    public_id: 'oldPublicId',
  },
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnValue({ firstName: 'Test', lastName: 'User', phone: '+1234567890' }),
};

export const app = express();
app.use(express.json());

// Set up routes for testing, but do not call .listen()
app.get('/profile', (req, res) => {
  req.headers.authorization = 'Bearer validtoken';
  return userController.getProfile(req as any, res);
});

app.put('/profile/name', (req, res) => {
  req.headers.authorization = 'Bearer validtoken';
  return userController.updateUserName(req as any, res);
});

describe('User Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(jwt, 'verify').mockImplementation(() => ({ userId: 'user123' }));
    // Patch userModel.findById for tests that use select()
    const userModel = require('../models/userModel');
    jest.spyOn(userModel, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValueOnce({
        _id: 'user123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'user',
        imageUrl: 'http://example.com/image.jpg',
      }),
    } as any);
  });

  test('PUT /profile/name - should update user name', async () => {
    const { findById } = require('../models/userModel');
    findById.mockResolvedValueOnce(mockUser);

    const res = await request(app)
      .put('/profile/name')
      .send({ firstName: 'New', lastName: 'Name', phone: '+1234567890' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Profile updated successfully');
  });
});
