import {each, escapeHTML} from './utils'

// Runtime
// -------
class Runtime {

  constructor(templates) {
    this._templates = {}
    this._filters = {}
    each(templates, (name, tpl) => this._templates[name] = tpl)
  }

  setFilter(name, helper) {
    this._filters[name] = helper
  }

  getFilter(name) {
    return this._filters[name]
  }

  hasFilter(name) {
    return !!this._filters[name]
  }

  // Parse a template block.
  block(locals, context, tpl, negateTpl) {
    if (!context) tpl = (negateTpl || '')
    if ('function' !== typeof tpl) return
    if (context instanceof Array) {
      each(context, function (item) {
        tpl(locals, item)
      })
      return
    }
    tpl(locals, context)
  }

  // Run an if/else block
  ifelse(locals, context, tpl, negateTpl) {
    if (!context) tpl = (negateTpl || '')
    if ('function' !== typeof tpl) return
    tpl(locals)
  }

  // Safely escape HTML
  escapeHtml(string, helper) {
    if (helper && this.hasFilter(helper))
      string = this.getFilter(helper)(string)
    return escapeHTML(string)
  }

  urlEncode(url) {
    return encodeURIComponent(url);
  }

  // Used by 'renderTemplate'
  addTemplate(name, template) {
    this._templates[name] = template
  }

  getTemplate(name) {
    if (!name) return this._templates
    return this._templates[name]
  }

}

export default Runtime
