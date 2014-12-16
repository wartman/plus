"use strict";

var tags = require('./tags').tags;
var delimiters = require('./tags').delimiters;
var Runtime = require('./runtime')["default"];
var Compiler = require('./compiler')["default"];
var uniqueId = require('./utils').uniqueId;


// Plus
// ----
// The primary API
var Plus = (function () {
  var Plus = function Plus(options) {
    this._tags = tags;
    this._tags.DELIMITERS = delimiters; // temp, rethink the way you pass these guys around
    this._runtime = new Runtime();
    this._loader = false;
  };

  Plus.prototype.setFilter = function (name, helper) {
    this._runtime.setFilter(name, helper);
    return this;
  };

  Plus.prototype.setLoader = function (loader) {
    if (!loader.resolve || !loader.load) throw new Error("Loader must have a `resolve` and a `load` method");
    this._loader = loader;
    return this;
  };

  Plus.prototype.getLoader = function () {
    return this._loader;
  };

  Plus.prototype.getRuntime = function () {
    return this._runtime;
  };

  Plus.prototype.getTags = function () {
    return this._tags;
  };

  Plus.prototype.compile = function (name, template, next, options) {
    var _this = this;
    if ("function" === typeof template) {
      options = next;
      next = template;
      template = name;
      name = false;
    }
    var compiler = new Compiler(template, this.getTags(), this.getLoader());
    options || (options = {});
    if (name) {
      compiler.setTemplateName(name);
    } else {
      name = uniqueId("tpl");
    }
    compiler.compile(function (err, template) {
      var tpl;
      if (err) {
        next(err);
        return;
      }
      _this._runtime.addTemplate(name, template);
      if (options.noWrap) {
        tpl = _this._runtime.getTemplate(name);
      } else {
        tpl = function (locals) {
          return this.run(this._runtime.getTemplate(name), locals);
        }.bind(_this);
      }
      next(null, tpl);
    });
    return this;
  };

  Plus.prototype.run = function (compiledTemplate, locals) {
    if ("string" === typeof compiledTemplate) {
      compiledTemplate = this._runtime.getTemplate(compiledTemplate);
    }
    return compiledTemplate(locals, this._runtime);
  };

  return Plus;
})();

Plus.run = function (compiledTemplate, locals) {
  return this.getInstance().run(compiledTemplate, locals);
};

Plus.compile = function (name, template, next) {
  return this.getInstance().compile(name, template, next);
};

Plus.precompile = function (name, template, next) {
  return this.getInstance().compile(name, template, next, { noWrap: true });
};

Plus.setLoader = function (loader) {
  return this.getInstance().setLoader(loader);
};

Plus.getLoader = function () {
  return this.getInstance().getLoader();
};

Plus.getInstance = function () {
  if (!this._instance) this._instance = new Plus();
  return this._instance;
};

exports["default"] = Plus;