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
    this._output = ''
    this._template = null
  }

  // Parse the provided string into a template function.
  compile(next) {
    return this
      .setOnDone(() => {
        this._cleanupPlaceholders()
        var output = this.getOutput()
        var err = null
        if (this.hasErrors()) {
          next(this.getLastWrappedError())
          return
        }
        output = "locals || (locals = {});\nvar out='';\nout+=\'" + output + "\';\n return out;"
        try {
          this._template = Function('locals,rt', output)
        } catch (e) {
          err = e
        }
        next(err, this._template)
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
    this.appendOutput(str).next()
    return this
  }

  // Move to the next token.
  next() {
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
    try {
      tag.handler(token, this)
    } catch(e) {
      this.setError(e).exit()
      return this
    }
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
    return this
  }

  // Parse a token for its current context
  parseContext(token) {
    var raw = (token.value || token)
    raw = raw.trim()
    var value = ('.' === raw.charAt(0))
      ? 'sub["' + raw.replace('.', '') + '"]'
      : 'locals["' + raw + '"]'
    return value
  }

  // Add a placeholder to the template
  writePlaceholder(name) {
    this.write('@PLACEHOLDER' + name + '@')
    return this
  }

  // Remove any unused placeholders
  _cleanupPlaceholders() {
    var output = this.getOutput()
    output = output.replace(/\@PLACEHOLDER\s?\S+\@/g, '')
    this.setOutput(output)
    return this
  }

  // Add a block.
  addBlock(block) {
    this._blocks[block.name] = {
      name: block.name,
      type: block.type,
      placeholder: block.placeholder || false,
      content: []
    }
    return this
  }

  // Open a block, and start adding content to it.
  openBlock(name) {
    if (!this.hasBlock(name)) {
      this.addError('Cannot open blocks that do not exist: ' + name).exit()
      return this
    }
    this._openBlocks.push(name)
    this._openBlock = name
    return this
  }

  hasBlock(block) {
    return !!this._blocks[block]
  }

  // Get a block by name
  getBlock(block) {
    return this._blocks[block]
  }

  // Insert a block into the output
  appendBlockToContent(name) {
    var block = this.getBlock(name)
    if (!block) {
      this
        .setError('No block found: ' + name)
        .exit()
      return this
    }
    var content = block.content.join('')
    if (block.placeholder) {
      var output = this.getOutput().replace('@PLACEHOLDER' + block.name + '@', content)
      this.setOutput(output)
    } else {
      this.appendOutput(content)
    }
    return this
  }

  // Close the last opened block, and set the parent block
  // to active (if applicable)
  closeOpenBlock() {
    var block = this.getOpenBlock()
    this._openBlocks.pop()
    this._openBlock = (this._openBlocks.length > 0)
      ? this._openBlocks[(this._openBlocks.length - 1)]
      : ''
    if (block && 'block' === block.type) {
      this.appendBlockToContent(block.name)
    }
    return this
  }

  // Get the current open block
  getOpenBlock() {
    return this.getBlock(this._openBlock)
  }

  getTokens() {
    return this._tokens
  }

  getLoader() {
    return this._loader
  }

  // Add content to the output
  appendOutput(str) {
    if (str) {
      var block = this.getOpenBlock()
      if (block && 'block' === block.type) {
        block.content.push(str)
      } else {
        this._output += str
      }
    }
    return this
  }

  // Get the raw content
  getOutput() {
    return this._output
  }

  // Overwrite all content
  setOutput(content) {
    this._output = content
    return this
  }

  // Get the compiled template
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
