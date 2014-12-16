var Class = require('simple-class')
var tags = require('./tags')
var Runtime = require('./runtime')
var Compiler = require('./compiler')
var utils = require('./utils')

// Plus
// ----
// The primary API
var Plus = Class.extend({

  tags: tags,

  delimiters: tags.DELIMITERS,

  constructor: function (options) {
    this._runtime = new Runtime()
    this._loader = false
  },

  setFilter: function (name, helper) {
    this._runtime.setFilter(name, helper)
    return this
  },

  setLoader: function (loader) {
    if (!loader.resolve || !loader.load) 
      throw new Error('Loader must have a `resolve` and a `load` method')
    this._loader = loader
    return this
  },

  getLoader: function () {
    return this._loader
  },

  getRuntime: function () {
    return this._runtime
  },

  getTags: function () {
    return this.tags
  },

  // Compile a template. If 'noWrap' is false, you can run the template
  // directly. Otherwise, you'll need to pass the compiled
  // function to Plus.run
  compile: function (name, template, next, options) {
    if ('function' === typeof template) {
      options = next
      next = template
      template = name
      name = false
    }
    var compiler = new Compiler(template, this.getTags(), this.getLoader())
    var self = this
    options || (options = {})
    if (name) {
      compiler.setTemplateName(name)
    } else {
      name = utils.uniqueId('tpl')
    }
    compiler.compile(function (err, template) {
      var tpl
      if (err) {
        next(err)
        return
      }
      self._runtime.addTemplate(name, template)
      if (options.noWrap) {
        tpl = self._runtime.getTemplate(name)
      } else {
        tpl = function (locals) {
          return self.run(self._runtime.getTemplate(name), locals)
        }
      }
      next(null, tpl)
    })
    return this
  },

  // Run a precompiled template. If compiledTemplate is a string, 
  // plus will attempt to find a template with that name.
  run: function (compiledTemplate, locals) {
    if ('string' === typeof compiledTemplate) {
      compiledTemplate = this._runtime.getTemplate(compiledTemplate)
    }
    return compiledTemplate(locals, this._runtime)
  }

}, {

  run: function (compiledTemplate, locals) {
    return this.getInstance().run(compiledTemplate, locals)
  },

  compile: function (name, template, next) {
    return this.getInstance().compile(name, template, next)
  },

  precompile: function (name, template, next) {
    return this.getInstance().compile(name, template, next, {noWrap: true})
  },

  setLoader: function (loader) {
    return this.getInstance().setLoader(loader)
  },

  getLoader: function () {
    return this.getInstance().getLoader()
  },

  getInstance: function () {
    if (!this._instance) this._instance = new Plus()
    return this._instance
  }

})

module.exports = Plus
