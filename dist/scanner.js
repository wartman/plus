"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// Scanner
// -------
var Scanner = (function () {
  function Scanner(string) {
    _classCallCheck(this, Scanner);

    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  _prototypeProperties(Scanner, null, {
    eos: {
      value: function eos() {
        return this.tail === "";
      },
      writable: true,
      configurable: true
    },
    scan: {

      // Try to match the passed regular expression at the current position.
      value: function scan(re) {
        var match = this.tail.match(re);
        if (!match || match.index !== 0) {
          return "";
        }var string = match[0];
        this.tail = this.tail.substring(string.length);
        this.pos += string.length;
        return string;
      },
      writable: true,
      configurable: true
    },
    scanUntil: {

      // Skip text until the given expression is matched.
      value: function scanUntil(re) {
        var index = this.tail.search(re),
            match;
        switch (index) {
          case -1:
            match = this.tail;
            this.tail = "";
            break;
          case 0:
            match = "";
            break;
          default:
            match = this.tail.substring(0, index);
            this.tail = this.tail.substring(index);
        }
        this.pos += match.length;
        return match;
      },
      writable: true,
      configurable: true
    }
  });

  return Scanner;
})();

module.exports = Scanner;