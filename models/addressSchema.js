const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Address Schema
const addressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required:true,
    },
    address: [{
        street: {
            type: String,
            required: [true, 'Street address is required'],
            trim: true,
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true,
        },
        state: {
            type: String,
            trim: true,
            required: true,
        },
        pinCode: {
            type: String,
            required: [true, 'Postal Code is required'],
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            trim: true,
        },
        phoneNumber: {
            type: String,
            match: [/^\d{10}$/, 'Please enter a valid phone number'],
            default: null, // Optional phone number
        },
        isDefault: {
            type: Boolean,
            default: false, // Can be used to mark a default address in case of multiple addresses
        }
    
    }],
}, {
    timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

// Export Address Model
const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
