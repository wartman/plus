"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _tags = require("./tags");

var tags = _tags.tags;
var delimiters = _tags.delimiters;
var uniqueId = require("./utils").uniqueId;
var Runtime = _interopRequire(require("./runtime"));

var Compiler = _interopRequire(require("./compiler"));

// Plus
// ----
// The primary API
var Plus = (function () {
  function Plus(options) {
    _classCallCheck(this, Plus);

    this._tags = tags;
    this._tags.DELIMITERS = delimiters; // temp, rethink the way you pass these guys around
    this._runtime = new Runtime();
    this._loader = false;
  }

  _prototypeProperties(Plus, {
    run: {
      value: function run(compiledTemplate, locals) {
        return this.getInstance().run(compiledTemplate, locals);
      },
      writable: true,
      configurable: true
    },
    compile: {
      value: function compile(name, template, next) {
        return this.getInstance().compile(name, template, next);
      },
      writable: true,
      configurable: true
    },
    precompile: {
      value: function precompile(name, template, next) {
        return this.getInstance().compile(name, template, next, { noWrap: true });
      },
      writable: true,
      configurable: true
    },
    setLoader: {
      value: function setLoader(loader) {
        return this.getInstance().setLoader(loader);
      },
      writable: true,
      configurable: true
    },
    getLoader: {
      value: function getLoader() {
        return this.getInstance().getLoader();
      },
      writable: true,
      configurable: true
    },
    getInstance: {
      value: function getInstance() {
        if (!this._instance) this._instance = new Plus();
        return this._instance;
      },
      writable: true,
      configurable: true
    }
  }, {
    setFilter: {
      value: function setFilter(name, helper) {
        this._runtime.setFilter(name, helper);
        return this;
      },
      writable: true,
      configurable: true
    },
    setLoader: {
      value: function setLoader(loader) {
        if (!loader.resolve || !loader.load) throw new Error("Loader must have a `resolve` and a `load` method");
        this._loader = loader;
        return this;
      },
      writable: true,
      configurable: true
    },
    getLoader: {
      value: function getLoader() {
        return this._loader;
      },
      writable: true,
      configurable: true
    },
    getRuntime: {
      value: function getRuntime() {
        return this._runtime;
      },
      writable: true,
      configurable: true
    },
    getTags: {
      value: function getTags() {
        return this._tags;
      },
      writable: true,
      configurable: true
    },
    compile: {

      // Compile a template. If 'noWrap' is false, you can run the template
      // directly. Otherwise, you'll need to pass the compiled
      // function to Plus.run
      value: function compile(name, template, next, options) {
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
          if (err) return next(err);
          if (!options.noWrap) {
            var wrappedTemplate = template;
            var self = _this;
            template = function (locals) {
              return self.run(wrappedTemplate, locals);
            };
          }
          next(null, template);
        });
        return this;
      },
      writable: true,
      configurable: true
    },
    run: {

      // Run a precompiled template. If compiledTemplate is a string,
      // plus will attempt to find a template with that name.
      value: function run(compiledTemplate, locals) {
        return compiledTemplate(locals, this._runtime);
      },
      writable: true,
      configurable: true
    }
  });

  return Plus;
})();

module.exports = Plus;