const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = new Schema({
  username: {
    type: String,
    required: true,
  }, 
}, {
  versionKey: false

});

module.exports = mongoose.model("UserSchema", userSchema);