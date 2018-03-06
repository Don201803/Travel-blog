var express = require("express");
var router  = express.Router();
var Message = require("../models/message");
var request = require("request");

//message New
router.get("/messages", function(req, res){
             res.render("messages/message");
    });

//message Create
router.post("/messages",function(req, res){
       var guestname= req.body.guestname;
       var guestmail= req.body.guestmail;
       var I_think_that= req.body.I_think_that;
       var guestbook= req.body.guestbook;
       var newMessage = {guestname:guestname, guestmail:guestmail, I_think_that:I_think_that, guestbook:guestbook}
       req.flash("success","新增留言已成功，謝謝您的使用，祝您一切順心！");
       res.redirect("/messages");
   });



module.exports = router;