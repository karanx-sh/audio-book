const router = require("express").Router();
const audioController = require("../controllers/audio");
const authConrtoller = require("../custom/authmiddleware");

const apiUrl = process.env.API;

// To add new blog
router.post(
  "/Add",
  audioController.uploadAudio.single("audio"),
  (req, res, next) => {
    console.log(req);
    next();
  },
  audioController.addAudioBook
);

// To get all blogs
router.get("/get/all", audioController.getAudio);

router.post("/get/signed", audioController.getAudioSigned);

// To remove the blog
router.post("/delete", audioController.remove);

// manage blogs page
router.get("/manage", (req, res) => {
  res.render("index", { api: apiUrl });
});

module.exports = router;
