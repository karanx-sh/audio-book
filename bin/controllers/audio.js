const fs = require("fs");
const path = require("path");
const uniqid = require("uniqid");
const multer = require("multer");
const Audio = require("../models/audio");
const CustomError = require("../custom/error"); // Importing Custome Error class
const customError = require("../custom/errors"); // Importing Developer Defined Custom Errors
const { getSignedURL, uploadFile, deleteFile } = require("../custom/s3");
const cloud = require("../custom/cloud");

const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(path.join("uploads"));
    cb(null, path.join("uploads")); // save the initial in uploads folder
  },
  filename: function (req, file, cb) {
    console.log("Disk storage  " + file.originalname);

    cb(null, `${uniqid()}${file.originalname}`); // rename the audio with a unique ID + file name
  },
});

// check the file format before saving....
const multerFilter = (req, file, cb) => {
  console.log("filter " + file.originalname);
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
    if (!req.body.title || !req.body.description || !req.body.author || !req.file) throw customError.dataInvalid;
    let key = await uploadFile(path.join(req.file.path), req.file.originalname);
    let audio = await Audio.create({
      title: req.body.title,
      description: req.body.description,
      author: req.body.author,
      key: key.key,
    });
    fs.unlinkSync(path.join(req.file.path));
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

// get all audio books
exports.getAudio = async (req, res) => {
  try {
    let audio = await Audio.findAll();
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

exports.getAudioSigned = async (req, res) => {
  try {
    if (!req.body.id) throw customError.dataInvalid;
    let audio = await Audio.findOne({ where: { id: req.body.id } });
    if (!audio) throw customError.audioNotFound;
    let url = await cloud.getsignedUrl(process.env.AWS_CDN_DOMAIN, audio.key, 1);
    res.status(200).json({
      error: false,
      details: {
        message: "Audio books found",
        data: audio,
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
    let data = await deleteFile(audio.key);
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
