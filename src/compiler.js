var Class = require('simple-class')
var Tokenizer = require('./tokenizer')

// Compiler
// --------
var Compiler = Class.extend({

  constructor: function (template, tags, loader) {
    this._templateName = ''
    this._raw = template
    this._tags = tags
    this._loader = loader
    this._blocks = {}
    this._openBlocks = []
    this._openBlock = false
    this._tokens = []
    this._errors = []
    this._onDone = []
    this._compiled = ''
    this._template = null
  },

  // Parse the provided string into a template function.
  compile: function (next) {
    var self = this
    this._compiled = "ctx || (ctx = {});\nvar __t='';\n__t+=\'"
    return this
      .setOnDone(function () {
        self._compiled += "\';\n return __t"
        var err = null
        if (self.hasErrors()) {
          next(self.getLastWrappedError())
          return
        }
        try {
          self._template = Function('ctx, __runtime', self._compiled)
        } catch (e) {
          err = e
        }
        next(err, self._template)
      })
      .pipe(this._raw)
      .write()
  },

  // Add text to the token stream, pushing new tokens to the
  // start of the stream
  pipe: function (text) {
    var tokenizer = new Tokenizer(text, this._tags)
    var i, newTokens
    tokenizer.parse()
    newTokens = tokenizer.getTokens()
    // Add tokens in reverse order
    for (i = (newTokens.length - 1); i >= 0; i--) {
      this._tokens.unshift(newTokens[i])
    }
    return this
  },

  // Start writing output
  write: function (str) {
    // Add pending content
    if (str) this._compiled += str
    // Then parse the next token
    var token = this._tokens.shift()
    if (!token) {
      // We're done
      this.complete()
      return this
    }
    var tag = this._tags[token.tag]
    if (!tag){ 
      return this
        .setError('No tag found: ' + token.tag)
        .exit()
    }
    tag.handler(token, this)
    return this
  },

  // Move to the next token without outputting anything.
  next: function () {
    this.write(false)
    return this
  },

  // Stop processing tokens, and remove any remaining ones.
  exit: function () {
    this._tokens = []
    this.complete()
    return this
  },

  complete: function () {
    while (this._onDone.length) {
      var fn = this._onDone.pop()
      fn.apply(this, arguments)
    }
  },

  // Parse a token for its current context
  // @todo: this seems like the wrong place to put this?
  parseContext: function (token) {
    var raw = (token.value || token)
    raw = raw.trim()
    var value = ('.' === raw.charAt(0))
      ? 'sub' + raw
      : 'ctx.' + raw
    return value
  },

  // @todo:
  // Block functionality here is just preparing for
  // later inheritance functionality. Need to implement
  // the ability for blocks to be overwritten
  openBlock: function (block) {
    this._blocks[block.name] = {
      name: block.name,
      type: block.type,
    }
    this._openBlocks.push(block.name)
    this._openBlock = block.name
    return this
  },

  closeOpenBlock: function () {
    this._openBlocks.pop()
    this._openBlock = (this._openBlocks.length > 0)
      ? this._openBlocks[(this._openBlocks.length - 1)]
      : ''
    return this
  },

  getOpenBlock: function () {
    return this.getBlock(this._openBlock)
  },

  getBlock: function (block) {
    return this._blocks[block]
  },

  getTokens: function () {
    return this._tokens
  },

  getLoader: function () {
    return this._loader
  },

  getTemplate: function () {
    return this._template
  },

  setTemplateName: function (name) {
    this._templateName = name
    return this
  },

  getTemplateName: function () {
    return this._templateName
  },

  // Add an error to the stack
  setError: function (err) {
    this._errors.push(err)
    return this
  },

  // Check if any errors were thrown during compiling
  hasErrors: function () {
    return this._errors.length > 0
  },

  // Get all errors
  getErrors: function () {
    return this._errors
  },

  // Return the last error, and wrap it in an `Error` if needed
  getLastWrappedError: function () {
    var err = this.getErrors().pop()
    if (err instanceof Error) return err
    return new Error(err)
  },

  setOnDone: function (fn) {
    this._onDone.push(fn)
    return this
  },

  getOnDone: function () {
    return this._onDone
  }

})

module.exports = Compiler
