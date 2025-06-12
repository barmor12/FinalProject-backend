import mongoose from 'mongoose';

const creditCardSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        cardNumber: {
            type: String,
            required: true,
            // Only store last 4 digits for security
            get: (v: string) => `****-****-****-${v.slice(-4)}`,
        },
        cardHolderName: {
            type: String,
            required: true,
        },
        expiryDate: {
            type: String,
            required: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        // Store a hashed version of the full card number for validation
        cardHash: {
            type: String,
            required: true,
        },
        // Store card type (Visa, Mastercard, etc.)
        cardType: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true },
    }
);

// Ensure only one default card per user
creditCardSchema.index({ userId: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });

export default mongoose.model('CreditCard', creditCardSchema); 