import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, // קשר להזמנה
  cake: { type: mongoose.Schema.Types.ObjectId, ref: 'Cake', required: true }, // קשר לעוגה
  quantity: { type: Number, required: true },
});



module.exports = mongoose.model('OrderItem', orderItemSchema);
