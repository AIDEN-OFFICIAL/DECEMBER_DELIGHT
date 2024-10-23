const User = require("../models/userSchema");

const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data && !data.isBlocked) {
                    next();
                } else {
                    res.redirect("/login")
                }
            })
            .catch(error => {
                console.log("error in user auth middleware");
                res.status(500).send("Internal Server error");
            })
    }
    else {
        res.redirect("/login")
    }
}

const adminAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(user => {
                if (user && user.isAdmin) {
                    next(); 
                } else {
                    res.redirect("/admin"); 
                }
            })
            .catch(error => {
                console.log("Error in admin auth middleware:", error);
                res.status(500).send("Internal Server error");
            });
    } else {
        res.redirect("/admin");
    }
};

module.exports = {
    userAuth,
    adminAuth,
};
