const mongoose = require("mongoose");
const exerciseSchema = mongoose.Schema({
    username: {
      type: String,
    },
        userId: {
            type: String,
            required: true,

         }, 
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,
            required: true
        },
        date: {
            type: Date, 
            default: new Date(),

          } 
        }, {
            versionKey: false
          }
       
    
);
module.exports = mongoose.model("ExerciseSchema", exerciseSchema);

//date: {$lte: to == undefined ? Date.now() : new Date(to).toISOString()  , $gte: new Date(from).toISOString()}}