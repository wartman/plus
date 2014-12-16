var Class = require('simple-class')
var utils = require('./utils')

// Runtime
// -------
var Runtime = Class.extend({

  constructor: function (templates) {
    var self = this
    this._templates = {}
    this._filters = {}
    utils.each(templates, function (name, tpl) {
      self._templates[name] = tpl
    })
  },

  setFilter: function (name, helper) {
    this._filters[name] = helper
  },

  getFilter: function (name) {
    return this._filters[name]
  },

  hasFilter: function (name) {
    return !!this._filters[name]
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

  // Run an if/else block
  ifelse: function (locals, context, tpl, negateTpl) {
    if (!context) tpl = (negateTpl || '')
    if ('function' !== typeof tpl) return
    tpl(locals)
  },

  // Safely escape HTML
  escapeHtml: function (string, helper) {
    if (helper && this.hasFilter(helper))
      string = this.getFilter(helper)(string)
    return utils.escapeHTML(string)
  },

  urlEncode: function(url) {
    return encodeURIComponent(url);
  },

  // Used by 'renderTemplate'
  addTemplate: function (name, template) {
    this._templates[name] = template
  },

  getTemplate: function (name) {
    if (!name) return this._templates
    return this._templates[name]
  }

})

module.exports = Runtime
