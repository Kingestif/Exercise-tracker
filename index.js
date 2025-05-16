require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const User = require('./models/User');
const Exercise = require('./models/Exercise');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


app.get('/', (req, res) => {
  res.send('Exercise Tracker API');
});

// 1. Create new user
app.post('/api/users', async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
});

// 3. Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const userId = req.params._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(400).send('User not found');

    const exercise = new Exercise({
      userId,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
    });

    await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: exercise.date.toDateString(),
      duration: exercise.duration,
      description: exercise.description
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const userId = req.params._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(400).send('User not found');

    const filter = { userId };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const exercises = await Exercise.find(filter)
      .limit(parseInt(limit) || 0)
      .select('description duration date');

    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises.map(e => ({
        description: e.description,
        duration: e.duration,
        date: e.date.toDateString()
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
