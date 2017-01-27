var mongoose = require('mongoose');

var Meme = mongoose.model('Meme', {
  caption: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  file: {
    fullPath : {
      type : String,
      required: true,
      minlength: 1,
      trim: true
    },
    relativePath : {
      type : String,
      required: true,
      minlength: 1,
      trim: true
    }
  },
  _creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

module.exports = {Meme};
