"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Scanner = _interopRequire(require("./scanner"));

var _utils = require("./utils");

var each = _utils.each;
var escapeRegExp = _utils.escapeRegExp;


// A cache for tags, so they only need to be built once.
var _tagsCache = {
  built: false,
  symbols: {},
  tags: {},
  tagNames: {},
  openTag: "",
  closeTag: ""
};

// Tokenizer
// ---------
var Tokenizer = (function () {
  function Tokenizer(template, tags) {
    _classCallCheck(this, Tokenizer);

    this._raw = template;
    this._tags = tags;
    this._delimiters = tags.DELIMITERS;
    this._tokens = [];
    this._buildTags();
  }

  _prototypeProperties(Tokenizer, null, {
    _buildTags: {
      value: function _buildTags() {
        var symbols = [];
        var sorts = {};
        var self = this;
        if (_tagsCache.built) {
          this._symbols = _tagsCache.symbols;
          this._tags = _tagsCache.tags;
          this._tagNames = _tagsCache.tagNames;
          this._openTag = _tagsCache.openTag;
          this._closeTag = _tagsCache.closeTag;
          return;
        }
        this._openTag = _tagsCache.openTag = new RegExp(escapeRegExp(this._delimiters.open) + "\\s*");
        this._closeTag = _tagsCache.closeTag = new RegExp("\\s*" + escapeRegExp(this._delimiters.close));
        each(this._tags, function (val, name) {
          if (name === "DELIMITERS") return;
          if (!val.tag) return;
          symbols.push(val.tag);
          sorts[val.tag] = name;
        });
        symbols.sort(function (a, b) {
          var aName = sorts[a];
          var bName = sorts[b];
          if (self._tags[aName].priority > self._tags[bName].priority) {
            return 1;
          } else if (self._tags[aName].priority < self._tags[bName].priority) {
            return -1;
          }
          return 0;
        });
        each(symbols, function (tag, index) {
          symbols[index] = escapeRegExp(tag);
        });
        this._symbols = _tagsCache.symbols = new RegExp(symbols.join("|"));
        this._tags = _tagsCache.tags = symbols;
        this._tagNames = _tagsCache.tagNames = sorts;
        _tagsCache.built = true;
      },
      writable: true,
      configurable: true
    },
    parse: {
      value: function parse() {
        var scanner = new Scanner(this._raw);

        while (!scanner.eos()) {
          var start = scanner.pos;
          var value = scanner.scanUntil(this._openTag);

          if (value) {
            this._tokens.push({
              tag: "txt",
              value: value,
              start: start,
              end: value.length
            });
          }

          if (!scanner.scan(this._openTag)) break;

          var tagName = this._tagNames[scanner.scan(this._symbols)] || "escape";
          var token = {};
          token.tag = tagName;
          token.value = scanner.scanUntil(this._closeTag);
          if (!scanner.scan(this._closeTag)) throw new Error("Unclosed tag at " + scanner.pos);
          token.start = start;
          token.end = scanner.pos;
          this._tokens.push(token);
        }
        return this._tokens;
      },
      writable: true,
      configurable: true
    },
    getTokens: {
      value: function getTokens() {
        return this._tokens;
      },
      writable: true,
      configurable: true
    }
  });

  return Tokenizer;
})();

module.exports = Tokenizer;