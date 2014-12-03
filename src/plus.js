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
    this.runtime = new Runtime()
  },

  registerHelper: function (name, helper) {
    this.runtime.registerHelper(name, helper)
  },

  registerLoader: function (loader) {
    if (!loader.resolver || !loader.load) 
      throw new Error('Loader must have a resolver and a load method')
    this.loader = loader
  },

  // Compile a template. If 'noWrap' is false, you can run the template
  // directly. Otherwise, you'll need to pass the compiled
  // function to Plus.run
  compile: function (name, template, noWrap) {
    if (!template) {
      template = name
      name = utils.uniqueId('tpl')
    }
    var compiler = new Compiler(template, this.tags, this.delimiters)
    this.runtime.registerTemplate(name, compiler.compile())
    if (compiler.dependencies.length > 0) {
      var self = this
      utils.each(compiler.dependencies, function (dep) {
        if (self.runtime.templates[dep]) return
        if (self.loader) self.loader.load(self.loader.resolve(dep, name))
      })
    }
    if (noWrap) return this.runtime.templates[name]
    var self = this
    return function (locals) {
      return self.run(self.runtime.templates[name], locals)
    }
  },

  // Run a precompiled template. If compiledTemplate is a string, 
  // plus will attempt to find a template with that name.
  run: function (compiledTemplate, locals) {
    if ('string' === typeof compiledTemplate) {
      return this.runtime.includeTemplate(compiledTemplate, locals)
    }
    return compiledTemplate(locals, this.runtime)
  }

}, {

  run: function (compiledTemplate, locals) {
    return this.getInstance().run(compiledTemplate, locals)
  },

  compile: function (name, template) {
    return this.getInstance().compile(name, template)
  },

  precompile: function (name, template) {
    return this.getInstance().compile(name, template, true)
  },

  getInstance: function () {
    if (!this._instance) this._instance = new Plus()
    return this._instance
  }

})

module.exports = Plus
