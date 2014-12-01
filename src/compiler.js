var Class = require('util/simple-class')
var Tokenizer = require('./tokenizer')

// Compiler
// --------
var Compiler = Class.extend({

  constructor: function (template, tags, delimiters) {
    this.raw = template
    this.tags = tags
    this.delimiters = delimiters
    this.tokens = []
    this.blocks = []
    this.dependencies = []
    this._compiled = ''
    this._template = null
  },

  compile: function () {
    var tokenizer = new Tokenizer(this.raw, this.tags, this.delimiters)
    this.tokens = tokenizer.parse()
    this._compiled = "ctx || (ctx = {});\nvar __t='';\n__t+=\'"
    this.write()
    this._compiled += "\';\n return __t"
    this._template = Function('ctx, __runtime', this._compiled)
    return this._template
  },

  // Add a dependency
  addDependency: function (dep) {
    this.dependencies.push(dep)
  },

  write: function (str) {
    // Add pending content
    if (str) this._compiled += str
    // Then parse the next token
    var token = this.tokens.shift()
    if (!token) return
    var tag = this.tags[token.tag]
    if (!tag) throw new Error('No tag found: ' + token.tag)
    tag.handler(token, this)
  },

  exit: function () {
    // do nothing
  },

  getContext: function (token) {
    var raw = (token.value || token)
    raw = raw.trim()
    var value = (this.blocks.length && (raw.indexOf('.') === 0))
      ? 'sub' + raw
      : 'ctx.' + raw
    return value
  }

})

module.exports = Compiler
