const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Message = require('./Message');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  isBlockedFromGroup: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    await Message.deleteMany({ 
      $or: [
        { sender: this._id },
        { receiver: this._id }
      ]
    });
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 