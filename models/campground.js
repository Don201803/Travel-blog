var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
   name: { type: String, required: true },
   image1: { type: String, required: true },
   image2: String,
   image3: String,
   description: { type: String, required: true },
   cost: { type: String, required: true },
   location: String,
   lat: Number,
   lng: Number,
   createdAt: { type: Date, default: Date.now },
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});

module.exports = mongoose.model("Campground", campgroundSchema);