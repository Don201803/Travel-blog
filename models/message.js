var mongoose = require("mongoose");

var messageSchema = new mongoose.Schema({
    guestname: String,
    guestmail: String,
    I_think_that: String,
    guestbook: String,
});

module.exports = mongoose.model("Message", messageSchema);