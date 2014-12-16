"use strict";

var each = require('./utils').each;
var escapeHTML = require('./utils').escapeHTML;


// Runtime
// -------
var Runtime = (function () {
  var Runtime = function Runtime(templates) {
    var self = this;
    this._templates = {};
    this._filters = {};
    each(templates, function (name, tpl) {
      self._templates[name] = tpl;
    });
  };

  Runtime.prototype.setFilter = function (name, helper) {
    this._filters[name] = helper;
  };

  Runtime.prototype.getFilter = function (name) {
    return this._filters[name];
  };

  Runtime.prototype.hasFilter = function (name) {
    return !!this._filters[name];
  };

  Runtime.prototype.block = function (locals, context, tpl, negateTpl) {
    if (!context) tpl = (negateTpl || "");
    if ("function" !== typeof tpl) return;
    if (context instanceof Array) {
      each(context, function (item) {
        tpl(locals, item);
      });
      return;
    }
    tpl(locals, context);
  };

  Runtime.prototype.ifelse = function (locals, context, tpl, negateTpl) {
    if (!context) tpl = (negateTpl || "");
    if ("function" !== typeof tpl) return;
    tpl(locals);
  };

  Runtime.prototype.escapeHtml = function (string, helper) {
    if (helper && this.hasFilter(helper)) string = this.getFilter(helper)(string);
    return escapeHTML(string);
  };

  Runtime.prototype.urlEncode = function (url) {
    return encodeURIComponent(url);
  };

  Runtime.prototype.addTemplate = function (name, template) {
    this._templates[name] = template;
  };

  Runtime.prototype.getTemplate = function (name) {
    if (!name) return this._templates;
    return this._templates[name];
  };

  return Runtime;
})();

exports["default"] = Runtime;