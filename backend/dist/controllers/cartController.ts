"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromCart = exports.cartGet = exports.addToCart = void 0;
const cartModel_1 = __importDefault(require("../models/cartModel"));
const cakeModel_1 = __importDefault(require("../models/cakeModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authController_1 = require("./authController");
const addToCart = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    console.log("Request body received in addToCart:", req.body);
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
      return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
      const decoded = jsonwebtoken_1.default.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET
      );
      const userId = decoded.userId;
      const { cakeId } = req.body;
      if (!cakeId) {
        return (0, authController_1.sendError)(res, "Cake ID is required", 400);
      }
      const cake = yield cakeModel_1.default.findById(cakeId);
      if (!cake) {
        return (0, authController_1.sendError)(res, "Cake not found", 404);
      }
      let cart = yield cartModel_1.default.findOne({ user: userId });
      if (!cart) {
        cart = new cartModel_1.default({ user: userId, items: [] });
      }
      const existingItem = cart.items.find(
        (item) => item.cake.toString() === cakeId
      );
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.items.push({ cake: cakeId, quantity: 1 });
      }
      const updatedCart = yield cart.save();
      res.status(200).json({
        message: "Cake added to cart successfully",
        cart: updatedCart,
      });
    } catch (err) {
      console.error("Add to cart error:", err);
      (0, authController_1.sendError)(res, "Failed to add cake to cart", 500);
    }
  });
exports.addToCart = addToCart;
const cartGet = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
      return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
      const decoded = jsonwebtoken_1.default.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET
      );
      const userId = decoded.userId;
      const cart = yield cartModel_1.default
        .findOne({ user: userId })
        .populate("items.cake");
      if (!cart) {
        return res.status(200).json({ items: [] });
      }
      res.status(200).json(cart);
    } catch (err) {
      console.error("Get cart error:", err);
      (0, authController_1.sendError)(res, "Failed to get cart", 500);
    }
  });
exports.cartGet = cartGet;
const removeFromCart = (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authController_1.getTokenFromRequest)(req);
    if (!token) {
      return (0, authController_1.sendError)(res, "Token required", 401);
    }
    try {
      const decoded = jsonwebtoken_1.default.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET
      );
      const userId = decoded.userId;
      const { cakeId } = req.body;
      if (!cakeId) {
        return (0, authController_1.sendError)(res, "Cake ID is required", 400);
      }
      const cart = yield cartModel_1.default.findOne({ user: userId });
      if (!cart) {
        return (0, authController_1.sendError)(res, "Cart not found", 404);
      }
      cart.items = cart.items.filter((item) => item.cake.toString() !== cakeId);
      const updatedCart = yield cart.save();
      res.status(200).json({
        message: "Cake removed from cart successfully",
        cart: updatedCart,
      });
    } catch (err) {
      console.error("Remove from cart error:", err);
      (0,
      authController_1.sendError)(res, "Failed to remove cake from cart", 500);
    }
  });
exports.removeFromCart = removeFromCart;

exports.default = {
  addToCart: exports.addToCart,
  getCart,
  removeFromCart: exports.removeFromCart,
};
