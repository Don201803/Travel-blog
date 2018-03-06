require('dotenv').config()

var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    passport    = require("passport"),
    cookieParser = require("cookie-parser"),
    LocalStrategy = require("passport-local"),
    flash        = require("connect-flash"),
    Campground  = require("./models/campground"),
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
    Message     = require("./models/message"),
    session = require("express-session"),
    seedDB      = require("./seeds"),
    methodOverride = require("method-override");
    
//requiring routes
var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index"),
    messageRoutes    = require("./routes/messages")

mongoose.connect("mongodb://chen:1qaz@ds137206.mlab.com:37206/travel123", {useMongoClient: true});
mongoose.Promise = global.Promise;

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
app.use(cookieParser('secret'));


var moment = require('moment');
app.locals.moment = moment;
var moment = require('moment-timezone');
moment.locale('zh-tw');

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "I think this is a very cool thing but no one konws really a lot",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});


app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/", messageRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("啟動中");
});

app.get("/about", function(req, res){
   res.render("about"); 
});
