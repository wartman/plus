"use strict";

var each = require('./utils').each;
var escapeHTML = require('./utils').escapeHTML;
var Runtime = (function () {
  var Runtime = function Runtime() {
    this._blockHandlers = {};
    this._defaultHandlers();
  };

  Runtime.prototype._defaultHandlers = function () {
    // {{+<context>}}{{/<context>}}
    this.addBlockHandler("block", function (locals, options) {
      var context = options.context;
      var tpl = options.fn;
      var inverse = options.inverse;
      if (!context) {
        context = {};
        // Placeholders should be rendered even if no content is present
        tpl = (options.placeholder) ? (inverse || tpl) : (inverse || "");
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
      if (!options.context) tpl = (options.inverse || "");
      if ("function" !== typeof tpl) return;
      tpl(locals);
    });
  };

  Runtime.prototype.addBlockHandler = function (type, fn) {
    this._blockHandlers[type] = fn;
    return this;
  };

  Runtime.prototype.hasBlockHandler = function (type) {
    return !!this._blockHandlers[type];
  };

  Runtime.prototype.getBlockHandler = function (type) {
    return this._blockHandlers[type];
  };

  Runtime.prototype.runBlock = function (type, locals, options) {
    if (!this.hasBlockHandler(type)) {
      throw new Error("No block handler of that type found: " + type);
    }
    options || (options = {});
    this.getBlockHandler(type).call(this, locals, options);
  };

  Runtime.prototype.escapeHtml = function (string, helper) {
    if (helper && this.hasFilter(helper)) string = this.getFilter(helper)(string);
    return (string) ? escapeHTML(string) : "";
  };

  Runtime.prototype.unescapedHtml = function (string) {
    return (string) ? string += "" : "";
  };

  Runtime.prototype.urlEncode = function (url) {
    return encodeURIComponent(url);
  };

  return Runtime;
})();

exports["default"] = Runtime;