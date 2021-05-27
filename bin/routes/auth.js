const router = require("express").Router();
const authController = require("../controllers/user");

// sign up
router.post("/signup", authController.uploadImage.array("docs", 2), authController.signup);

//verify sign up otp
router.post("/signup/verify", authController.verifyOTP);

//Some Action To send OTP Message!
router.post("/send/otp", authController.sendOTP);

//Some Action To Login with OTP!
router.post("/login", authController.login);

//Some Action To Refesh Token!
router.post("/refresh", authController.refresh);

module.exports = router;
