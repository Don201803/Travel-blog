var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

//root route
router.get("/", function(req, res){
    res.render("landing"); 
});

// show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'}); 
});

//handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({
        username: req.body.username, 
        firstName: req.body.firstName,
        lastName: req.body.lastName, 
        avatar: req.body.avatar, 
        email: req.body.email
      });
    
    if(req.body.adminCode === "xxxxxxxxxxxx"){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            req.flash("error", err.message);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
          req.flash("success", "您已成功登入" + req.body.username);
          res.redirect("/campgrounds"); 
        });
    });
});

//show login form
router.get("/login", function(req, res){
   res.render("login"); 
});

//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "登出成功");
   res.redirect("/campgrounds");
});

// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', '此e-mail並無註冊過會員');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'testtest@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'testtest@gmail.com',
        subject: '福爾摩沙會員密碼重置',
        text: '親愛的會員您好！若您需要重置您的會員密碼,請依照下列步驟完成操作.若您無密碼重置需求,請直接忽略此信件內容即可\n\n' +
          '請點擊下面的連結完成密碼重置作業, 若無法點擊請複製網址貼在瀏覽器輸入網址處:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          '我們重視每一位會員,若有使用上的任何問題,歡迎至官網網站上與我們聯絡！謝謝您的使用\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', '一封e-mail已寄到' + user.email + ' 的信箱中,請至您的信箱中確認');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', '很抱歉!您並無權限使用此一功能');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', '很抱歉!您並無權限使用此一功能');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "請輸入相同的密碼");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'testtest@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'testtest@gmail.com',
        subject: '福爾摩沙會員重要通知',
        text: '親愛的會員您好！\n\n' +
          '您的會員帳號' + user.email + ' 新密碼已經生效\n\n' +
          '下次登入請使用新密碼\n\n' +
          '我們重視每一位會員,若有使用上的任何問題,歡迎至官網網站上與我們聯絡！謝謝您的使用\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', '密碼更新成功！下次登入請使用新密碼');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});

// USER PROFILE
router.get("/users/:id", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if(err) {
      req.flash("error", "Something went wrong.");
      res.redirect("/");
    }
    Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds) {
      if(err) {
        req.flash("error", "Something went wrong.");
        res.redirect("/");
      }
      res.render("users/show", {user: foundUser, campgrounds: campgrounds});
    })
  });
});


module.exports = router;