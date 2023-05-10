const endOfLine = require('os').EOL;
const chalk = require("chalk")

module.exports =  {
  printKeyValueArrayInBox: function(arr, box) {

    var statusString = ''
    for (let lineArr of arr) {
      var keystr = " " + chalk.green(lineArr[0] + ":  ")
      var valuestr = chalk.white(lineArr[1])
      statusString += this.padStr('                                   ', keystr, false) + valuestr + endOfLine
    }
    box.setContent(statusString)
  },
  padStr: function (pad, str, padLeft) {
    if (typeof str === 'undefined')
      return pad;
    if (padLeft) {
      return (pad + str).slice(-pad.length);
    } else {
      return (str + pad).substring(0, pad.length);
    }
  }
}
