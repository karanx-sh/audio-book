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

// To remove the audio book
router.post("/delete", audioController.remove);

// add chapter to audio book
router.post("/book/add", audioController.uploadAudio.array("books"), audioController.addBooks);

// update chapter of the audio book
router.post("/book/update", audioController.updateBooks);

// remove chapter of the audio book
router.post("/book/remove", audioController.removeBooks);

module.exports = router;
