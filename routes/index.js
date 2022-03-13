const express = require("express");
const router = express.Router();

const jenosizeController = require("./../controller/jenosizeController");

const validateHeaders = (req, res, next) => {
  const sessionCookie = req.cookies.session || "";

  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then((userData) => {
      console.log("Logged in:", userData.email);
      next();
    })
    .catch((error) => {
      console.log(error);
      res.redirect("/login");
    });
};
/* GET home page. */
router.get("/", jenosizeController.index);

router.post("/game", jenosizeController.game);

router.get("/login", jenosizeController.login);

router.get("/profile", validateHeaders, jenosizeController.profile);

router.post("/sessionLogin", jenosizeController.sessionLogIn);

router.get("/sessionLogout", jenosizeController.sessionLogOut);

module.exports = router;
