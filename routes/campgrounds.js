var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var geocoder = require("geocoder");
var request = require("request");

router.get("/about", function(req, res){
    res.render("about");
});


//INDEX - show all campgrounds
router.get("/", function(req, res){
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch=null;
    if(req.query.search){
         const regex = new RegExp(escapeRegex(req.query.search), 'gi');
         Campground.find({name: regex}).sort({ "createdAt": -1 }).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count({name: regex}).exec(function (err, count) {
            if(err){
                console.log(err);
                res.redirect("back");
            } else {
                if(allCampgrounds.length <1){
                    noMatch = "很抱歉！目前無符合的資料，請輸入其它關鍵字查詢";
                }
                res.render("campgrounds/index",{
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
        
    }else{
    // Get all campgrounds from DB
    Campground.find({}).sort({ "createdAt": -1 }).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count().exec(function (err, count) {
       if(err){
           console.log(err);
       } else {
                res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});

//CREATE - add new campground to DB
    router.post("/", middleware.isLoggedIn, function(req, res) {
    
    if(req.body.location.length < 1){
        res.redirect('back');
        }else{
    
    var name = req.body.name;
    var image1 = req.body.image1;
    var image2 = req.body.image2;
    var image3 = req.body.image3;
    var cost = req.body.cost;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }

    geocoder.geocode(req.body.location, function (err, data) {
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newCampground = {name: name, image1: image1, image2: image2, image3: image3, cost: cost, description:desc, author:author, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            req.flash('error', err.message);
            res.redirect('back');
        } else {
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
});
}
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - show more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error","很抱歉!您並無權限使用此一功能");
            res.redirect("/campgrounds/");
        } else {
            console.log(foundCampground)
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

router.get("/:id/edit", middleware.checkUserCampground, function(req, res){
    console.log("IN EDIT!");
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/edit", {campground_id: req.params.id, campground: foundCampground});
        }
    });
});

router.put("/:id", function(req, res){
    geocoder.geocode(req.body.campground.location, function (err, data) {
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newData = {
        name: req.body.campground.name,
        image1: req.body.campground.image1,
        image2: req.body.campground.image2,
        image3: req.body.campground.image3,
        cost: req.body.campground.cost,
        description: req.body.campground.description,
        location: location,
        lat: lat,
        lng: lng
    };
    Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, campground){
        if(err){
            req.flash("error", "請重新輸入一次");
            res.redirect("/campgrounds");
        } else {
            req.flash("success","您已成功更新頁面");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});
});


router.delete("/:id", middleware.checkUserCampground ,function(req, res){
   Campground.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/campgrounds");
      } else{
          res.redirect("/campgrounds");
      }
   });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;

