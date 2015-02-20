"use strict";

// Iterator
exports.each = each;
exports.uniqueId = uniqueId;


// Make sure a given string is javascript safe.
exports.escapeJS = escapeJS;


// Make a string HTML safe
exports.escapeHTML = escapeHTML;


// Make sure a given string is regexp safe.
exports.escapeRegExp = escapeRegExp;
function each(obj, callback, context) {
  if (!obj) {
    return obj;
  }context = context || obj;
  if (Array.prototype.forEach && obj.forEach) {
    obj.forEach(callback);
  } else if (obj instanceof Array) {
    for (var i = 0; i < obj.length; i += 1) {
      if (obj[i] && callback.call(context, obj[i], i, obj)) {
        break;
      }
    }
  } else {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (key && callback.call(context, obj[key], key, obj)) {
          break;
        }
      }
    }
  }
  return obj;
}

// Does what it says on the tin
var counter = 0;
function uniqueId(prefix) {
  counter += 1;
  return prefix + counter.toString(16);
}

// Escape things that javascript might choke on.
var jsEscapes = {
  "'": "'",
  "\\": "\\",
  "\r": "r",
  "\n": "n",
  "\t": "t",
  "\u2028": "u2028",
  "\u2029": "u2029"
};function escapeJS(string) {
  return string.replace(/\\|'|\r|\n|\t|\u2028|\u2029/g, function (match) {
    return "\\" + jsEscapes[match];
  });
}

// Various HTML safe entities.
var entityMap = {
  "&": "&amp",
  "<": "&lt",
  ">": "&gt",
  "\"": "&quot",
  "'": "&#39",
  "/": "&#x2F"
};

// Matcher for the above.
var entityMapMatch = (function () {
  var matches = [];
  each(entityMap, function (value, key) {
    matches.push(key);
  });
  return new RegExp(matches.join("|"));
})();function escapeHTML(string) {
  string = "" + string; // ensure stringiness
  return string.replace(entityMapMatch, function (key) {
    return entityMap[key];
  });
}function escapeRegExp(string) {
  return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
Object.defineProperty(exports, "__esModule", {
  value: true
});