const User = require("../models/userSchema");

const userAuth = (req,res,next) => {
    if (req.session.user) {
        User.findById(req.session.user)
    .then(data => {
        if (data && !data.isBlocked) {
            next();
        } else {
            res.redirect("/login")
        }
    })
        .catch({ error=>{
            console.log("error in user auth middleware");
            res.status(500).send("Internal Server error");
        }
    })

}

const adminAuth = (req, res, next) => {
    if (!req.session.admin) {
      return res.redirect('/admin/login');
    }
    next();
  };
  
  module.exports = adminAuth;
  