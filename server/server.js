require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Meme} = require('./models/meme');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

var app = express();
const port = process.env.PORT;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-auth");
  res.header("Access-Control-Expose-Headers", "x-auth");
  next();
});
app.use("/img", express.static(__dirname + '/img'));
app.use(bodyParser.json());
app.use(fileUpload());

app.post('/memes', authenticate, (req, res) => {

  var image = req.files.file;

  image.ext = image.name.split('.').pop();
  image.newName = "mane";
  image.relativePath = ['/img', [image.newName, image.ext].join('.')].join('/');
  image.newPath = [__dirname, image.relativePath].join('/');

  image.mv(image.newPath, function(err) {
    if (err) {
      res.status(400).send(err);
    }

    var meme = new Meme({
        caption: req.body.caption,
        file : {
            fullPath : image.newPath,
            relativePath : image.relativePath,
        },
        _creator: req.user._id
    });

    meme.save().then((doc) => {
        res.send(doc);
    }, (e) => {
      res.status(400).send(e);
    });
  });
});

app.get('/memes', (req, res) => {
  Meme.find().then((memes) => {
    res.send({memes});
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/memes/:id', (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Meme.findOne({
    _id: id,
  }).then((meme) => {
    if (!meme) {
      return res.status(404).send();
    }

    res.send({meme});
  }).catch((e) => {
    res.status(400).send();
  });
});

app.delete('/memes/:id', authenticate, (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Meme.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  }).then((meme) => {
    if (!meme) {
      return res.status(404).send();
    }

    res.send({meme});
  }).catch((e) => {
    res.status(400).send();
  });
});

// POST /users
app.post('/users', (req, res) => {
  var body = _.pick(req.body, ['username', 'email', 'password']);
  var user = new User(body);

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  })
});

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

app.post('/users/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((e) => {
    res.status(400).send();
  });
});

app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }, () => {
    res.status(400).send();
  });
});

app.listen(port, () => {
  console.log(`Started up at port ${port}`);
});

module.exports = {app};
