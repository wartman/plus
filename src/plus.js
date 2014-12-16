import {tags, delimiters} from './tags'
import Runtime from './runtime'
import Compiler from './compiler'
import {uniqueId} from './utils'

// Plus
// ----
// The primary API
class Plus {

  constructor(options) {
    this._tags = tags
    this._tags.DELIMITERS = delimiters // temp
    this._runtime = new Runtime()
    this._loader = false
  }

  setFilter(name, helper) {
    this._runtime.setFilter(name, helper)
    return this
  }

  setLoader(loader) {
    if (!loader.resolve || !loader.load) 
      throw new Error('Loader must have a `resolve` and a `load` method')
    this._loader = loader
    return this
  }

  getLoader() {
    return this._loader
  }

  getRuntime() {
    return this._runtime
  }

  getTags() {
    return this._tags
  }

  // Compile a template. If 'noWrap' is false, you can run the template
  // directly. Otherwise, you'll need to pass the compiled
  // function to Plus.run
  compile(name, template, next, options) {
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
      name = uniqueId('tpl')
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
  }

  // Run a precompiled template. If compiledTemplate is a string, 
  // plus will attempt to find a template with that name.
  run(compiledTemplate, locals) {
    if ('string' === typeof compiledTemplate) {
      compiledTemplate = this._runtime.getTemplate(compiledTemplate)
    }
    return compiledTemplate(locals, this._runtime)
  }

}

Plus.run = function (compiledTemplate, locals) {
  return this.getInstance().run(compiledTemplate, locals)
}

Plus.compile = function (name, template, next) {
  return this.getInstance().compile(name, template, next)
}

Plus.precompile = function (name, template, next) {
  return this.getInstance().compile(name, template, next, {noWrap: true})
}

Plus.setLoader = function (loader) {
  return this.getInstance().setLoader(loader)
}

Plus.getLoader = function () {
  return this.getInstance().getLoader()
}

Plus.getInstance = function () {
  if (!this._instance) this._instance = new Plus()
  return this._instance
}

export default Plus
