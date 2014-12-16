import Tokenizer from './tokenizer'

// Compiler
// --------
class Compiler {

  constructor(template, tags, loader) {
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
  }

  // Parse the provided string into a template function.
  compile(next) {
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
  }

  // Add text to the token stream, pushing new tokens to the
  // start of the stream
  pipe(text) {
    var tokenizer = new Tokenizer(text, this._tags)
    var i, newTokens
    tokenizer.parse()
    newTokens = tokenizer.getTokens()
    // Add tokens in reverse order
    for (i = (newTokens.length - 1); i >= 0; i--) {
      this._tokens.unshift(newTokens[i])
    }
    return this
  }

  // Start writing output
  write(str) {
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
  }

  // Move to the next token without outputting anything.
  next() {
    this.write(false)
    return this
  }

  // Stop processing tokens, and remove any remaining ones.
  exit() {
    this._tokens = []
    this.complete()
    return this
  }

  complete() {
    while (this._onDone.length) {
      var fn = this._onDone.pop()
      fn.apply(this, arguments)
    }
  }

  // Parse a token for its current context
  // @todo: this seems like the wrong place to put this?
  parseContext(token) {
    var raw = (token.value || token)
    raw = raw.trim()
    var value = ('.' === raw.charAt(0))
      ? 'sub' + raw
      : 'ctx.' + raw
    return value
  }

  // @todo:
  // Block functionality here is just preparing for
  // later inheritance functionality. Need to implement
  // the ability for blocks to be overwritten
  openBlock(block) {
    this._blocks[block.name] = {
      name: block.name,
      type: block.type,
    }
    this._openBlocks.push(block.name)
    this._openBlock = block.name
    return this
  }

  closeOpenBlock() {
    this._openBlocks.pop()
    this._openBlock = (this._openBlocks.length > 0)
      ? this._openBlocks[(this._openBlocks.length - 1)]
      : ''
    return this
  }

  getOpenBlock() {
    return this.getBlock(this._openBlock)
  }

  getBlock(block) {
    return this._blocks[block]
  }

  getTokens() {
    return this._tokens
  }

  getLoader() {
    return this._loader
  }

  getTemplate() {
    return this._template
  }

  setTemplateName(name) {
    this._templateName = name
    return this
  }

  getTemplateName() {
    return this._templateName
  }

  // Add an error to the stack
  setError(err) {
    this._errors.push(err)
    return this
  }

  // Check if any errors were thrown during compiling
  hasErrors() {
    return this._errors.length > 0
  }

  // Get all errors
  getErrors() {
    return this._errors
  }

  // Return the last error, and wrap it in an `Error` if needed
  getLastWrappedError() {
    var err = this.getErrors().pop()
    if (err instanceof Error) return err
    return new Error(err)
  }

  setOnDone(fn) {
    this._onDone.push(fn)
    return this
  }

  getOnDone() {
    return this._onDone
  }

}

export default Compiler
