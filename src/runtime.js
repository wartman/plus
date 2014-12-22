import {each, escapeHTML} from './utils' 

class Runtime {

  constructor() {
    this._blockHandlers = {}
    this._defaultHandlers()
  }

  _defaultHandlers() {
    // {{+<context>}}{{/<context>}}
    this.addBlockHandler('block', function (locals, options) {
      var context = options.context
      var tpl = options.fn
      var inverse = options.inverse
      if (!context) {
        context = {}
        // Placeholders should be rendered even if no content is present
        tpl = (options.placeholder)
          ? (inverse || tpl)
          : (inverse || '')
      }
      if ('function' !== typeof tpl) return
      if (context instanceof Array) {
        each(context, function (item, index) {
          tpl(locals, item)
        })
        return
      }
      tpl(locals, context)
    })
    // {{?<context>}}{{/}}
    this.addBlockHandler('if', function (locals, options) {
      var tpl = options.fn
      if (!options.context) tpl = (options.inverse || '')
      if ('function' !== typeof tpl) return
      tpl(locals)
    })
  }

  addBlockHandler(type, fn) {
    this._blockHandlers[type] = fn
    return this
  }

  hasBlockHandler(type) {
    return !!this._blockHandlers[type]
  }

  getBlockHandler(type) {
    return this._blockHandlers[type]
  }

  runBlock(type, locals, options) {
    if (!this.hasBlockHandler(type)) {
      throw new Error('No block handler of that type found: ' + type)
    }
    options || (options = {})
    this.getBlockHandler(type).call(this, locals, options)
  }

  // Safely escape HTML
  escapeHtml(string, helper) {
    if (helper && this.hasFilter(helper))
      string = this.getFilter(helper)(string)
    return (string)? escapeHTML(string) : ''
  }

  unescapedHtml(string) {
    return (string)? string += '' : ''
  }

  urlEncode(url) {
    return encodeURIComponent(url);
  }

}

export default Runtime
