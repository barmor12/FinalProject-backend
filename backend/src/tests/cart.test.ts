import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as cartController from '../controllers/cartController';
import Cart from '../models/cartModel';
import Cake from '../models/cakeModel';

jest.mock('../models/cartModel');
jest.mock('../models/cakeModel');
jest.mock('jsonwebtoken');

const mockSend = jest.fn();
const mockStatus = jest.fn(() => ({ json: mockSend }));

const mockRes = {
  status: mockStatus,
  json: mockSend,
} as unknown as Response;

// Mock implementation for Cart.findOne().populate()
(Cart.findOne as jest.Mock).mockImplementation(() => ({
  populate: jest.fn().mockResolvedValue(null),
}));

describe('CartController', () => {
  const mockUserId = 'user123';
  const mockToken = 'mockToken';

  beforeEach(() => {
    jest.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue({ userId: mockUserId });
    // Reset the Cart.findOne mock to default implementation before each test
    (Cart.findOne as jest.Mock).mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue(null),
    }));
  });

  describe('addToCart', () => {
    it('should return 400 if cakeId or quantity is missing', async () => {
      const mockReq = {
        headers: { authorization: `Bearer ${mockToken}` },
        body: {},
      } as Request;

      await cartController.addToCart(mockReq, mockRes);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockSend).toHaveBeenCalledWith({
        error: 'Cake ID and quantity are required',
      });
    });
  });

  describe('updateCartItem', () => {
    it('should return 404 if cart not found', async () => {
      const mockReq = {
        headers: { authorization: `Bearer ${mockToken}` },
        body: { itemId: 'item123', quantity: 2 },
      } as Request;

      (Cart.findOne as jest.Mock).mockResolvedValue(null);

      await cartController.updateCartItem(mockReq, mockRes);
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockSend).toHaveBeenCalledWith({ error: 'Cart not found' });
    });

    it('should update item quantity if item exists', async () => {
      const mockReq = {
        headers: { authorization: `Bearer ${mockToken}` },
        body: { itemId: 'item123', quantity: 3 },
      } as Request;

      const mockCart = {
        items: [
          { _id: 'item123', quantity: 1 },
          { _id: 'item456', quantity: 2 },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      (Cart.findOne as jest.Mock).mockImplementation(() => mockCart);

      await cartController.updateCartItem(mockReq, mockRes);
      expect(mockCart.items[0].quantity).toBe(3);
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('getCart', () => {
    it('should return empty cart if not found', async () => {
      const mockReq = {
        headers: { authorization: `Bearer ${mockToken}` },
      } as Request;

      (Cart.findOne as jest.Mock).mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(null),
      }));

      await cartController.getCart(mockReq, mockRes);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockSend).toHaveBeenCalledWith({ items: [] });
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart if exists', async () => {
      const mockReq = {
        headers: { authorization: `Bearer ${mockToken}` },
        body: { itemId: 'item123' },
      } as Request;

      const mockCart = {
        items: [
          { _id: 'item123', quantity: 1 },
          { _id: 'item456', quantity: 2 },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      (Cart.findOne as jest.Mock).mockImplementation(() => mockCart);

      await cartController.removeFromCart(mockReq, mockRes);
      expect(mockCart.items.length).toBe(1);
      expect(mockCart.items[0]._id).toBe('item456');
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });
});
