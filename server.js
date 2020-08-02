const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({extended: false})); 

app.use(bodyParser.urlencoded({extended:true})); // middleware for parsing bodies from URL
// Returns middleware that only parses {urlencoded} bodies and only looks at requests 
// where the Content-Type header matches the type option. 
// This parser accepts only UTF-8 encoding of the body and supports automatic inflation of gzip and deflate encodings.
// A new body object containing the parsed data is 
// populated on the request object after the middleware (i.e. req.body).
//  This object will contain key-value pairs, where the value can be a string or array (when extended is false), or any type (when extended is true).
app.use(express.static(__dirname+ "/public"));
app.set("view engine", "ejs");
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const User = require("./models/userSchema");
const ExerciseLogs = require("./models/exerciseSchema");

const MONGO_URI = process.env.MONGOOSE_URI || "mongodb://localhost/tracker"
mongoose
     .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true  })
     .then(() => console.log( 'Database Connected' ))
     .catch(err => res.json({error: err.name, message: err.message, stack: err.stack}));

app.get("/",  (req,res)=> {
  let dateObj = new Date();
  let day = (dateObj.getUTCDate()) <10? "0" + dateObj.getUTCDate() : dateObj.getUTCDate() ;
  let month = (dateObj.getUTCMonth() + 1) <10? "0" + (dateObj.getUTCMonth() +1 ) : (dateObj.getUTMonth() + 1) ;
    res.render("index", {currentDate: dateObj.getUTCFullYear() + "-" + month + "-" + day});
}); 

// Adds a new user to the db 
app.post('/api/exercise/new-user', async (req, res) => {
  const {username} = req.body;
    try {
      if (await User.findOne({username})) {
        res.json({message: "This user name is already taken. Try another."})
    } else {
        let newUser = await new User({username});
        newUser.save();
        res.json(newUser);
  }
} catch (err) {
  res.json({error: err.name, message: err.message, stack: err.stack})
}
});

// Gets an array all of the users & their individual ids in the db
app.get("/api/exercise/users", async (req,res) => {
    try {
      let allUsers = await User.find();
      res.json(allUsers);
    } catch (err) {
      res.json({error: err.name, message: err.message, stack: err.stack})
    }
 });

 // Adds a new exercise w/ duration & date for a givn userId to the db
  app.post("/api/exercise/add", async (req,res) => {
    const {userId, description, duration} = req.body;
    let name, log, result, myAnswer;
    // Make sure the date is formatted correctly & is a date that can be used: 
    const date = (req.body.date == "") ? new Date().toDateString() : new Date(req.body.date).toDateString() == "Invalid Date"?  new Date().toDateString() : new Date(req.body.date).toDateString();
    try {
      let userObj = await User.find();
      let allUserIds = userObj.map( el => el._id);
      let userIdLen = allUserIds.filter(el=> el == userId);
      if (userIdLen == 0) { // if the user is not in the db, return an error & don't add the exercise
        res.json({message: "UserId is not valid. Add an Exercise for a User with a valid UserId."});
      } else { 
        // if the user is in the system: find the username & create a new instance of the exerice
           let userInSystem = User.find({_id: userId})
             .then(user => {        
               let userName = user[0].username;  
                 let userExerciseLogs =  new ExerciseLogs({
                    userId: userId,
                    description: description,
                    duration: duration,
                    date: date,
                    username: userName,
                 });
                 userExerciseLogs.save();
                 res.json({
                   _id: userId,
                   description: description,
                   duration: duration,
                   date: date,
                   username: userName})
              });
            }
    } catch (err) {
      res.json({error: err.name, message: err.message, stack: err.stack})
    }
  });
  
  // Return different info about the users & their exercise logs depending on the parameters used in the url
  app.get("/api/exercise/log",  async (req,res) => {
    const {id, from, to,limit} = req.query;
    // queries in url: ?param1=value&param2=value2
    // $gte: selects the documents where the value of the field is greater than or equal to a value  {field: {$gte: value} }
    // $lte: selects the documents where the value of the field is less than or equal to a value  {field: {$gte: value} }
    try {
      // if no query paramenters are included, an array of every exercise log will be returned (regardless of user) 
      if (Object.values(req.query).length == 0) {
        const allUsersExerciseLogs =  await ExerciseLogs.find();
        res.json(allUsersExerciseLogs);
       }
      else {
        let userLog =  await new Promise((resolve, reject) => {
           ExerciseLogs.find({userId: id, date: {$lte: new Date(to) != 'Invalid Date' ? new Date(to).toISOString() : Date.now()   , $gte: new Date(from) != 'Invalid Date' ? new Date(from).toISOString() : 0}}).limit(limit ==undefined? 1000: parseInt(limit))
            .then(list => { // 
              resolve(list);
            })
            .catch(err=> {
               return reject(err);
            }) 
    }).then(res => {
      log=res;
    });
    let usersname =  await new Promise((resolve, reject) => {
      User.find({_id: id})
        .then(list => {
           resolve(list[0].username);
        })
        .catch(err=> {
          return reject(err);
     })
  }).then(res => {
    name=res;
  })

  result = log.map((obj) =>  {
    return { description: obj.description, duration: obj.duration, date: obj.date }; 
});
  
   
  myAnswer ={id: id, username: name, count: log.length, log: result}
    res.json(myAnswer);
 } // end else statement 
} catch(err) {
     res.json({error: err.name, message: err.message, stack: err.stack})
    }
}); // end

const PORT = 3000 || process.env.PORT;
app.listen(PORT, () => {
   console.log(`App is listening ${PORT}.`);
});

// Test user api:
// /api/exercise/log?{userId}[&from][&to][&limit]
//from, to = dates (yyyy-mm-dd); limit = number
// /api/exercise/log?id=5f25a643a810df42d35f794f

// http://localhost:3000/api/exercise/log?id=5f25a643a810df42d35f794f
// http://localhost:3000/api/exercise/log?id=5f25a643a810df42d35f794f&from=2020-08-01
// http://localhost:3000/api/exercise/log?id=5f25a643a810df42d35f794f&from=2020-01-01&to=2020-08-01
// http://localhost:3000/api/exercise/log?id=5f25a643a810df42d35f794f&from=2020-01-01&to=2020-08-01&limit=2


// GET /api/exercise/log?{userId}[&from][&to][&limit]
// Jamie20: 5f25a643a810df42d35f794f
