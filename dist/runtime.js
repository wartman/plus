"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _utils = require("./utils");

var each = _utils.each;
var escapeHTML = _utils.escapeHTML;
var Runtime = (function () {
  function Runtime() {
    _classCallCheck(this, Runtime);

    this._blockHandlers = {};
    this._defaultHandlers();
  }

  _prototypeProperties(Runtime, null, {
    _defaultHandlers: {
      value: function _defaultHandlers() {
        // {{+<context>}}{{/<context>}}
        this.addBlockHandler("block", function (locals, options) {
          var context = options.context;
          var tpl = options.fn;
          var inverse = options.inverse;
          if (!context) {
            context = {};
            // Placeholders should be rendered even if no content is present
            tpl = options.placeholder ? inverse || tpl : inverse || "";
          }
          if ("function" !== typeof tpl) return;
          if (context instanceof Array) {
            each(context, function (item, index) {
              tpl(locals, item);
            });
            return;
          }
          tpl(locals, context);
        });
        // {{?<context>}}{{/}}
        this.addBlockHandler("if", function (locals, options) {
          var tpl = options.fn;
          if (!options.context) tpl = options.inverse || "";
          if ("function" !== typeof tpl) return;
          tpl(locals);
        });
      },
      writable: true,
      configurable: true
    },
    addBlockHandler: {
      value: function addBlockHandler(type, fn) {
        this._blockHandlers[type] = fn;
        return this;
      },
      writable: true,
      configurable: true
    },
    hasBlockHandler: {
      value: function hasBlockHandler(type) {
        return !!this._blockHandlers[type];
      },
      writable: true,
      configurable: true
    },
    getBlockHandler: {
      value: function getBlockHandler(type) {
        return this._blockHandlers[type];
      },
      writable: true,
      configurable: true
    },
    runBlock: {
      value: function runBlock(type, locals, options) {
        if (!this.hasBlockHandler(type)) {
          throw new Error("No block handler of that type found: " + type);
        }
        options || (options = {});
        this.getBlockHandler(type).call(this, locals, options);
      },
      writable: true,
      configurable: true
    },
    escapeHtml: {

      // Safely escape HTML
      value: function escapeHtml(string, helper) {
        if (helper && this.hasFilter(helper)) string = this.getFilter(helper)(string);
        return string ? escapeHTML(string) : "";
      },
      writable: true,
      configurable: true
    },
    unescapedHtml: {
      value: function unescapedHtml(string) {
        return string ? string += "" : "";
      },
      writable: true,
      configurable: true
    },
    urlEncode: {
      value: function urlEncode(url) {
        return encodeURIComponent(url);
      },
      writable: true,
      configurable: true
    }
  });

  return Runtime;
})();

module.exports = Runtime;