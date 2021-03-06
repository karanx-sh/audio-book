const fs = require("fs");
const path = require("path");
const uniqid = require("uniqid");
const multer = require("multer");
const { Op } = require("sequelize");

const Audio = require("../models/audio");
const CustomError = require("../custom/error"); // Importing Custome Error class
const customError = require("../custom/errors"); // Importing Developer Defined Custom Errors
const { getSignedURL, uploadFile, deleteFile } = require("../custom/s3");
const cloud = require("../custom/cloud");
const Books = require("../models/books");

const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join("./uploads")); // save the initial in uploads folder
  },
  filename: function (req, file, cb) {
    cb(null, `${uniqid()}_${file.originalname}`); // rename the audio with a unique ID + file name
  },
});

// check the file format before saving....
const multerFilter = (req, file, cb) => {
  var ext = path.extname(file.originalname);
  if (ext == ".mp4" || ext == ".mp3") {
    cb(null, true);
  } else {
    cb("Only mp3,mp4 are allowed", false);
  }
};

exports.uploadAudio = multer({
  storage: audioStorage,
  fileFilter: multerFilter,
});

// add audio book
exports.addAudioBook = async (req, res) => {
  try {
    if (!req.body.title || !req.body.code || !req.files) throw customError.dataInvalid;
    let audio = await Audio.create({
      title: req.body.title,
      code: req.body.code,
    });
    req.files.map(async (file) => {
      key = await uploadFile(path.join(file.path), file.originalname);
      await Books.create({
        title: file.originalname,
        key: key.Key,
        audio_id: audio.id,
      });
      fs.unlinkSync(path.join(file.path));
    });

    return res.status(200).json({
      error: false,
      details: {
        message: "Audio Book Added Successfully",
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 500).json({
      error: true,
      details: error,
    });
  }
};

// update audio book details
exports.updateAudioBook = async (req, res) => {
  try {
    if (!req.body.title || !req.body.code || !req.body.id) throw customError.dataInvalid;
    let audio = await Audio.findByPk(req.body.id);
    await audio.update({
      title: req.body.title,
      code: req.body.code,
    });

    return res.status(200).json({
      error: false,
      details: {
        message: "Audio Book updated Successfully",
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 500).json({
      error: true,
      details: error,
    });
  }
};

// get all audio books
exports.getAudio = async (req, res) => {
  try {
    let audio = await Audio.findAll({ include: { model: Books } });
    if (!audio) throw customError.audioNotFound;
    return res.status(200).json({
      error: false,
      details: {
        message: "Audio books found",
        data: audio,
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 500).json({
      error: true,
      details: error,
    });
  }
};

// get all audio books chpater by audio id
exports.getBooks = async (req, res) => {
  try {
    if (!req.body.id) throw customError.dataInvalid;
    let audio = await Audio.findByPk(req.body.id);
    if (!audio) throw customError.audioNotFound;
    let books = await Books.findAll({ where: { audio_id: audio.id } });
    return res.status(200).json({
      error: false,
      details: {
        message: "Audio books Chapters found",
        data: books,
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 500).json({
      error: true,
      details: error,
    });
  }
};

// get all books chapter
exports.getBooksChapters = async (req, res) => {
  try {
    let books = await Books.findAll();
    return res.status(200).json({
      error: false,
      details: {
        message: "Audio books Chapters found",
        data: books,
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 500).json({
      error: true,
      details: error,
    });
  }
};

//get Book Signed url
exports.getBookSigned = async (req, res) => {
  try {
    if (!req.body.id) throw customError.dataInvalid;
    let book = await Books.findOne({ where: { id: req.body.id } });
    if (!book) throw customError.audioNotFound;
    let url = await cloud.getsignedUrl(process.env.AWS_CDN_DOMAIN, book.key, 1);
    res.status(200).json({
      error: false,
      details: {
        message: "Audio books found",
        data: book,
        url: url,
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 500).json({
      error: true,
      details: error,
    });
  }
};

// remove audio book
exports.remove = async (req, res) => {
  try {
    if (!req.body.id) throw customError.dataInvalid;
    let audio = await Audio.findByPk(req.body.id);
    if (!audio) throw customError.audioNotFound;
    let books = await Books.findAll({ where: { audio_id: audio.id } });
    books.map(async (book) => {
      await deleteFile(book.key);
      await book.destroy();
    });
    await audio.destroy();
    return res.status(200).json({
      error: false,
      details: {
        message: "Audio Book Deleted successfully",
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 500).json({
      error: true,
      details: error,
    });
  }
};

// add audio book chapter
exports.addBooks = async (req, res) => {
  try {
    if (!req.body.id || !req.files) throw customError.dataInvalid;
    let audio = await Audio.findByPk(req.body.id);
    if (!audio) throw customError.audioNotFound;
    req.files.map(async (file) => {
      key = await uploadFile(path.join(file.path), file.originalname);
      await Books.create({
        title: file.originalname,
        key: key.Key,
        audio_id: audio.id,
      });
      fs.unlinkSync(path.join(file.path));
    });

    return res.status(200).json({
      error: false,
      details: {
        message: "Audio Book Added Successfully",
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 500).json({
      error: true,
      details: error,
    });
  }
};

// update audio book chapter details
exports.updateBooks = async (req, res) => {
  try {
    if (!req.body.id || !req.body.title) throw customError.dataInvalid;
    let book = await Books.findByPk(req.body.id);
    if (!book) throw customError.chapterNotFound;
    await book.update({
      title: req.body.title,
    });
    res.status(200).json({
      error: false,
      details: {
        message: "Audio Book chapter updated Successfully",
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 500).json({
      error: true,
      details: error,
    });
  }
};

// remove audio book chapter
exports.removeBooks = async (req, res) => {
  try {
    if (!req.body.id) throw customError.dataInvalid;
    let book = await Books.findByPk(req.body.id);
    if (!book) throw customError.chapterNotFound;

    await deleteFile(book.key);
    await book.destroy();

    return res.status(200).json({
      error: false,
      details: {
        message: "Audio Book chapter Deleted successfully",
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 500).json({
      error: true,
      details: error,
    });
  }
};

// search audio book chapters

exports.searchBooksChapters = async (req, res) => {
  try {
    if (!req.body.query) throw customError.dataInvalid;
    let books = await Books.findAll({
      where: {
        title: {
          [Op.like]: `%${req.body.query}%`,
        },
      },
    });
    return res.status(200).json({
      error: false,
      details: {
        message: "Audio books Chapters found",
        data: books,
      },
    });
  } catch (error) {
    console.log(`***** ERROR : ${req.originalUrl} ${error}`);
    return res.status(error.code || 500).json({
      error: true,
      details: error,
    });
  }
};
