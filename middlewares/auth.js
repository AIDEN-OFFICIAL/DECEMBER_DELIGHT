const User = require('../models/userSchema');

const userAuth = (req, res, next) => {
  if (req.session.user) {
    User.findById(req.session.user)
      .then((data) => {
        if (data) {
          if (!data.isBlocked) {
            next();
          } else {
            req.session.destroy();
            res.redirect('/signin');
          }
        } else {
          res.redirect('/signin');
        }
      })
      .catch((error) => {
        console.error('Error in user auth middleware:', error);
        res.status(500).send('Internal Server Error');
      });
  } else {
    next();
  }
};


const adminAuth = (req, res, next) => {
    if (req.session.admin) {
        User.findOne({isAdmin: true})
      .then((data) => {
        if (data) {
          next();
        } else {
          res.redirect('/admin');
        }
      })
      .catch((error) => {
        console.log('Error in admin auth middleware:', error);
        res.status(500).send('Internal Server error');
      });
  } else {
    res.redirect('/admin');
  }
};

module.exports = {
  userAuth,
  adminAuth,
};
