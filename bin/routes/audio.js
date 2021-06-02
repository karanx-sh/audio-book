const router = require("express").Router();
const audioController = require("../controllers/audio");
const authConrtoller = require("../custom/authmiddleware");

const apiUrl = process.env.API;

// To add new audio book
router.post("/Add", authConrtoller.checkAdmin, audioController.uploadAudio.array("audio"), audioController.addAudioBook);

// To get all audio book
router.get("/get/all", audioController.getAudio);

//get audio book chapter signed url
router.post("/get/signed", authConrtoller.checkCustomer, audioController.getBookSigned);

//get all chapters by audio book id
router.post("/books/get", audioController.getBooks);

// To remove the audio book
router.post("/delete", authConrtoller.checkAdmin, audioController.remove);

// add to audio book chapter
router.post("/book/add", authConrtoller.checkAdmin, audioController.uploadAudio.array("books"), audioController.addBooks);

// get all books chapter
router.get("/books/get/all", audioController.getBooksChapters);

// update of the audio book chapter
router.post("/book/update", authConrtoller.checkAdmin, audioController.updateBooks);

// remove of the audio book chapter
router.post("/book/remove", authConrtoller.checkAdmin, audioController.removeBooks);

module.exports = router;
