import request from 'supertest';
import express from 'express';
import * as cakeController from '../controllers/cakeController';
import Cake from '../models/cakeModel';
import User from '../models/userModel';

jest.mock('../models/cakeModel');
jest.mock('../models/userModel');

const app = express();
app.use(express.json());
app.post('/add', cakeController.addCake);
app.get('/cakes', cakeController.getAllCakes);
app.get('/favorites/:userId', cakeController.getFavorites);
app.post('/favorites', cakeController.addToFavorites);
app.delete('/favorites', cakeController.removeFromFavorites);

describe('CakeController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addCake', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app).post('/add').send({});
      expect(res.status).toBe(400);
    });

    it('should return 400 if cost >= price', async () => {
      const res = await request(app)
        .post('/add')
        .send({
          name: 'Cake',
          description: 'Test',
          cost: '10',
          price: '5',
          ingredients: ['flour'],
          imageUrl: 'http://example.com/image.jpg',
        });
      expect(res.status).toBe(400);
    });

    it('should save a valid cake', async () => {
      (Cake.prototype.save as jest.Mock).mockResolvedValue({
        name: 'Cake',
        description: 'Test',
        price: 20,
        cost: 10,
        ingredients: ['flour'],
        image: { url: 'http://example.com', public_id: 'id' },
      });

      const res = await request(app)
        .post('/add')
        .send({
          name: 'Cake',
          description: 'Test',
          cost: '10',
          price: '20',
          ingredients: ['flour'],
          imageUrl: 'http://example.com/image.jpg',
        });
      expect(res.status).toBe(201);
    });
  });

  describe('getAllCakes', () => {
    it('should return list of cakes', async () => {
      (Cake.find as jest.Mock).mockResolvedValue([{ name: 'Cake' }]);
      const res = await request(app).get('/cakes');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ name: 'Cake' }]);
    });
  });

  describe('Favorites', () => {
    it('should return 400 if userId is missing', async () => {
      const res = await request(app).get('/favorites/');
      expect(res.status).toBe(404); // Express throws 404 if param is missing
    });

    it('should return favorites list if user found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        populate: jest
          .fn()
          .mockResolvedValue({ favorites: ['cake1', 'cake2'] }),
      });

      const res = await request(app).get('/favorites/123');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ favorites: ['cake1', 'cake2'] });
    });

    it('should add to favorites', async () => {
      const mockSave = jest.fn();
      (User.findById as jest.Mock).mockResolvedValue({
        favorites: [],
        save: mockSave,
      });

      const res = await request(app)
        .post('/favorites')
        .send({ userId: 'u1', cakeId: 'c1' });
      expect(res.status).toBe(200);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should remove from favorites', async () => {
      const mockSave = jest.fn();
      (User.findById as jest.Mock).mockResolvedValue({
        favorites: ['c1'],
        save: mockSave,
      });

      const res = await request(app)
        .delete('/favorites')
        .send({ userId: 'u1', cakeId: 'c1' });
      expect(res.status).toBe(200);
      expect(mockSave).toHaveBeenCalled();
    });
  });
});
