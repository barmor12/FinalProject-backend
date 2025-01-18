import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // קשר למשתמש
  items: [
    {
      cake: { type: mongoose.Schema.Types.ObjectId, ref: 'Cake', required: true }, // קשר לעוגה
      quantity: { type: Number, required: true },
    },
  ],
});

module.exports = mongoose.model('Cart', cartSchema);
