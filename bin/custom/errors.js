const CustomError = require("./error");

const authFailed = new CustomError("Authorization Failed!", `Uh oh! i can't tell you anymore #BruteForcers! alert`, 401);
const dataInvalid = new CustomError("Data Invalid!", `Uh oh! the data you've sent is not as expected #Contact the developer!`, 417);
const userNotFound = new CustomError("User Not Found!", `Uh oh! i can't tell you anymore #BruteForcers! alert`, 404);
const userBanned = new CustomError("Account Suspended", `Your account is suspended `, 420);
const userUnderReview = new CustomError("Account Under Review", `Your account is currently is not verified`, 421);

const userExists = new CustomError("User Exists!", `Uh oh! the phone number entered is already registered`, 409);
const duplicateRequest = new CustomError("Already Done!", `Umm! The stuff you are trying to do is been done already!`, 409);
const serverDown = new CustomError("umm! Some Servers are down!", `we swear! that it's not us, we pay our server bills on time`, 404);
const badRequest = new CustomError("Bad Request!", `Umm! The stuff you are trying to do is unexpected!`, 400);

const audioNotFound = new CustomError("Audio Book Not Found!", `audio book your are searching is not present`, 404);

module.exports = { authFailed, dataInvalid, userNotFound, userExists, userBanned, userUnderReview, duplicateRequest, serverDown, badRequest, audioNotFound };
