const router = require("express").Router();
const audioController = require("../controllers/audio");
const authConrtoller = require("../custom/authmiddleware");

const apiUrl = process.env.API;

// To add new audio
router.post("/Add", audioController.uploadAudio.array("audio"), audioController.addAudioBook);

// To get all audios
router.get("/get/all", audioController.getAudio);

//get book signed url
router.post("/get/signed", audioController.getBookSigned);

//get all books by audio id
router.post("/books/get", audioController.getBooks);

// To remove the blog
router.post("/delete", audioController.remove);

module.exports = router;
