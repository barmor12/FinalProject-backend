import * as adminController from '../controllers/adminController';
import Order from '../models/orderModel';
import User from '../models/userModel';

jest.mock('../models/orderModel');
jest.mock('../models/userModel');

describe('AdminController - Additional Methods', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateOrder', () => {
    it('should return 404 if order not found', async () => {
      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
      const req = { params: { orderId: '123' }, body: {} } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await adminController.updateOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
    });

    it('should update order and return it', async () => {
      const mockOrder = { id: '123', totalPrice: 100 };
      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockOrder);
      const req = {
        params: { orderId: '123' },
        body: { totalPrice: 100 },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await adminController.updateOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ order: mockOrder });
    });
  });

  describe('updateUser', () => {
    it('should return 404 if user not found', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
      const req = { params: { userId: 'u1' }, body: {} } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await adminController.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should update user and return it (without password)', async () => {
      const userMock = {
        _id: 'u1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'admin',
      };
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(userMock);
      const req = { params: { userId: 'u1' }, body: {} } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await adminController.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: {
          _id: userMock._id,
          email: userMock.email,
          firstName: userMock.firstName,
          lastName: userMock.lastName,
          role: userMock.role,
        },
      });
    });
  });

  describe('getUserById', () => {
    it('should return 404 if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);
      const req = { params: { userId: 'x1' } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await adminController.getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return user if found', async () => {
      const mockUser = { _id: 'x1', email: 'u@test.com' };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      const req = { params: { userId: 'x1' } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await adminController.getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('toggleOrderPriority', () => {
    it('should return 400 if isPriority is not provided', async () => {
      const req = { params: { orderId: 'o1' }, body: {} } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await adminController.toggleOrderPriority(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'isPriority field is required',
      });
    });

    it('should return 404 if order not found', async () => {
      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
      const req = {
        params: { orderId: 'o1' },
        body: { isPriority: true },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await adminController.toggleOrderPriority(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
    });

    it('should update priority and return order', async () => {
      const mockOrder = { _id: 'o1', isPriority: true };
      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockOrder);
      const req = {
        params: { orderId: 'o1' },
        body: { isPriority: true },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await adminController.toggleOrderPriority(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Order priority set successfully',
        order: mockOrder,
      });
    });
  });
});
