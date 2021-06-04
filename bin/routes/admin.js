const router = require("express").Router();
const adminController = require("../controllers/admin");
const authConrtoller = require("../custom/authmiddleware");

// sign up
router.post("/signup", adminController.signup);

//Some Action To Login with OTP!
router.post("/login", adminController.login);

//Some Action To Refesh Token!
router.post("/refresh", adminController.refresh);

router.post("/user/verify", authConrtoller.checkAdmin, adminController.verifyUser);

router.post("/user/ban", authConrtoller.checkAdmin, adminController.BanUser);

router.get("/user/list", authConrtoller.checkAdmin, adminController.listUsers);

router.post("/user/docs", authConrtoller.checkAdmin, adminController.getDocSigned);

module.exports = router;
