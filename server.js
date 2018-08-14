const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

const logSchema = new Schema({
  description: {type: String, required: true},
  duration: {type: Number, min: 1, required: true},
  date: Date
});

const exerciseTrackerSchema = new Schema({
  username: {type: String, required: true},
  log: [logSchema]
});

const ExerciseTracker = mongoose.model('ExerciseTracker', exerciseTrackerSchema);


app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


app.post('/api/exercise/new-user', (req, res) => {
  const user = new ExerciseTracker({username: req.body.username});
  
  user.save((err, user) => {
    if (err) {
      console.log(err);
      res.json({"error": err});
    } else {
      res.json({
        "username": user.username,
        "_id": user.id 
      });
    }
  });
  
});


app.post('/api/exercise/add', (req, res) => {
  const exercise = {
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date && new Date(Date.parse(req.body.date))
  };
  
  ExerciseTracker.findById(req.body.userId, (err, user) => {
    if (err) {
      console.log(err);
      res.json({"error": 'unknown id'});
    } else {
      console.log(user);
      user.log.push(exercise);
      user.save((err, user) => {
        if (err) {
          console.log(err);
          res.json({
            error: err
          });
        } else {
          res.json({
            username: user.username,
            _id: user._id,
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date
          });
        } 
      });
    }
  });

});


app.get('/api/exercise/log', (req, res) => {
  ExerciseTracker.findById(req.query.userId, (err, user) => {
    if (err) {
      console.log(err);
      res.json({error: 'unknown id'});
    } else {
      let log = user.log;
      const query = {
        _id: user._id,
        username: user.username
      }
      
      if (req.query.from) {
        const fromDate = new Date(Date.parse(req.query.from));
        log = log.filter(exercise => exercise.date >= fromDate);
        query.from = fromDate;
      }
      
      if (req.query.to) {
        const toDate = new Date(Date.parse(req.query.to));
        log = log.filter(exercise => exercise.date < toDate);
        query.to = toDate;
      }
      
      if (req.query.limit) {
        log = log.slice(req.query.limit * -1);
        query.count = log.length;
      }
      
      query.log = log;
      
      res.json(query);
    }
  });
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
