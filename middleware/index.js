var Comment = require("../models/comment");
var Campground = require("../models/campground");
module.exports = {
    isLoggedIn: function(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        req.flash("error", "您必須先登入後才可使用此功能");
        res.redirect("/login");
    },
    checkUserCampground: function(req, res, next){
        if(req.isAuthenticated()){
            Campground.findById(req.params.id, function(err, campground){
            if(err || !campground){
               req.flash("error", "很抱歉!您並無權限使用此一功能");
               res.redirect("/campgrounds/");
           }  else {
               // does user own the campground?
            if(campground.author.id.equals(req.user._id) || req.user.isAdmin) {
                next();
            } else {
                req.flash("error", "您必須先登入後才可使用此功能");
                res.redirect("/login");
            }
        }
    });
        } else {
        req.flash("error", "您必須先登入後才可使用此功能");
        res.redirect("/login");
    }
},

    checkUserComment: function(req, res, next){
        if(req.isAuthenticated()){
            Comment.findById(req.params.commentId, function(err, comment){
                if(err|| !comment){
               req.flash("error", "很抱歉!您並無權限使用此一功能");    
               res.redirect("/campgrounds/" + req.params.id);
           }  else {
               // does user own the comment?
            if(comment.author.id.equals(req.user._id) || req.user.isAdmin) {
                next();
            } else {
                req.flash("error", "很抱歉!您並無權限使用此一功能");
                res.redirect("/campgrounds/" + req.params.id);
            }
           }
        });
    } else {
        req.flash("error", "您必須先登入後才可使用此功能");
        res.redirect("/login");
        }
    }
}