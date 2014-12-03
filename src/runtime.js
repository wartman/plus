var Class = require('simple-class')
var utils = require('./utils')

// Runtime
// -------
var Runtime = Class.extend({

  constructor: function (templates) {
    var self = this
    this.templates = {}
    utils.each(templates, function (name, tpl) {
      self.templates[name] = tpl
    })
  },

  registerHelper: function (name, helper) {
    this[name] = helper
  },

  // Parse a template block.
  block: function (locals, context, tpl, negateTpl) {
    if (!context) tpl = (negateTpl || '')
    if ('function' !== typeof tpl) return
    if (context instanceof Array) {
      utils.each(context, function (item) {
        tpl(locals, item)
      })
      return
    }
    tpl(locals, context)
  },

  // Run an else/if block
  elif: function (locals, context, tpl, negateTpl) {
    if (!context) tpl = (negateTpl || '')
    if ('function' !== typeof tpl) return
    tpl(locals)
  },

  // Safely escape HTML
  escapeHtml: function (string) {
    string = "" + string
    return string.replace(utils.match, function (key) {
      return utils.entityMap[key]
    })
  },

  urlEncode: function(url) {
    return encodeURIComponent(url);
  },

  // Used by 'renderTemplate'
  registerTemplate: function (name, template) {
    this.templates[name] = template
  },

  includeTemplate: function (tplName, locals) {
    if (this.templates.hasOwnProperty(tplName)) {
      return this.templates[tplName](locals, this)
    }
    throw new Error('No template of that name is registered: ' + tplName)
  }

})

module.exports = Runtime
