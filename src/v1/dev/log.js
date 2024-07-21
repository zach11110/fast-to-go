const path = require("path");
const colors = require("colors");

// customLogger.js
function getStackInfo() {
  const orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function (_, stack) {
    return stack;
  };
  const err = new Error();
  Error.captureStackTrace(err, getStackInfo);
  const stack = err.stack;
  Error.prepareStackTrace = orig;

  const stackFrame = stack[1]; // Index 1 because 0 is this function itself
  const dirName = path.join(__dirname, "..", "\\");
  const fileName = stackFrame.getFileName().replace(dirName, "");
  const lineNumber = stackFrame.getLineNumber();
  return { fileName, lineNumber };
}

function getOutput(...args) {
  let output = "";
  args.forEach((arg) => {
    output += arg + " ";
  });

  console.log(output);
}

function log(...args) {
  const { fileName, lineNumber } = getStackInfo();
  const fileShort = fileName.split("/").pop();
  console.log(colors.italic.magenta(`${fileShort}:${lineNumber}`));
  getOutput(...args);
  return;
}
module.exports = log;
