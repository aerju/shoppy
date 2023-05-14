const userHelpers = require("../helpers/user-helpers");

module.exports = {
  checkAdminLoggedIn: (req, res, next) => {
    if (req.session.adminLoggedIn) {
      next();
    } else {
      res.redirect("/admin");
    }
  },
  sessionHandle: (req, res, next) => {
    if (req.session.userLoggedIn) {
      res.redirect("/");
    } else {
      next();
    }
  },
  checkUserLoggedIn: async (req, res, next) => {
    if (req.session.userLoggedIn) {
      let user = await userHelpers.getUserDta(req.session.user._id);
      if (user.userstatus) {
        next();
      } else {
        {
          req.session.userLoggedIn = false;
          res.redirect("/login");
        }
      }
    } else {
      res.redirect("/login");
    }
  },
};
