const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/Deputies");

module.exports = mongoose;