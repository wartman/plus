"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Tokenizer = _interopRequire(require("./tokenizer"));

// Compiler
// --------
var Compiler = (function () {
  function Compiler(template, tags, loader) {
    _classCallCheck(this, Compiler);

    this._templateName = "";
    this._raw = template;
    this._tags = tags;
    this._loader = loader;
    this._blocks = {};
    this._openBlocks = [];
    this._openBlock = false;
    this._tokens = [];
    this._errors = [];
    this._onDone = [];
    this._output = "";
    this._template = null;
  }

  _prototypeProperties(Compiler, null, {
    compile: {

      // Parse the provided string into a template function.
      value: function compile(next) {
        var _this = this;
        return this.setOnDone(function () {
          _this._cleanupPlaceholders();
          var output = _this.getOutput();
          var err = null;
          if (_this.hasErrors()) {
            next(_this.getLastWrappedError());
            return;
          }
          output = "locals || (locals = {});\nvar out='';\nout+='" + output + "';\n return out;";
          try {
            _this._template = Function("locals,rt", output);
          } catch (e) {
            err = e;
          }
          next(err, _this._template);
        }).pipe(this._raw).write();
      },
      writable: true,
      configurable: true
    },
    pipe: {

      // Add text to the token stream, pushing new tokens to the
      // start of the stream
      value: function pipe(text) {
        var tokenizer = new Tokenizer(text, this._tags);
        var i, newTokens;
        tokenizer.parse();
        newTokens = tokenizer.getTokens();
        // Add tokens in reverse order
        for (i = newTokens.length - 1; i >= 0; i--) {
          this._tokens.unshift(newTokens[i]);
        }
        return this;
      },
      writable: true,
      configurable: true
    },
    write: {

      // Start writing output
      value: function write(str) {
        this.appendOutput(str).next();
        return this;
      },
      writable: true,
      configurable: true
    },
    next: {

      // Move to the next token.
      value: function next() {
        var token = this._tokens.shift();
        if (!token) {
          // We're done
          this.complete();
          return this;
        }
        var tag = this._tags[token.tag];
        if (!tag) {
          return this.setError("No tag found: " + token.tag).exit();
        }
        try {
          tag.handler(token, this);
        } catch (e) {
          this.setError(e).exit();
          return this;
        }
        return this;
      },
      writable: true,
      configurable: true
    },
    exit: {

      // Stop processing tokens, and remove any remaining ones.
      value: function exit() {
        this._tokens = [];
        this.complete();
        return this;
      },
      writable: true,
      configurable: true
    },
    complete: {
      value: function complete() {
        while (this._onDone.length) {
          var fn = this._onDone.pop();
          fn.apply(this, arguments);
        }
        return this;
      },
      writable: true,
      configurable: true
    },
    parseContext: {

      // Parse a token for its current context
      value: function parseContext(token) {
        var raw = token.value || token;
        raw = raw.trim();
        var value = "." === raw.charAt(0) ? "sub[\"" + raw.replace(".", "") + "\"]" : "locals[\"" + raw + "\"]";
        return value;
      },
      writable: true,
      configurable: true
    },
    writePlaceholder: {

      // Add a placeholder to the template
      value: function writePlaceholder(name) {
        this.write("@PLACEHOLDER" + name + "@");
        return this;
      },
      writable: true,
      configurable: true
    },
    _cleanupPlaceholders: {

      // Remove any unused placeholders
      value: function _cleanupPlaceholders() {
        var output = this.getOutput();
        output = output.replace(/\@PLACEHOLDER\s?\S+\@/g, "");
        this.setOutput(output);
        return this;
      },
      writable: true,
      configurable: true
    },
    addBlock: {

      // Add a block.
      value: function addBlock(block) {
        this._blocks[block.name] = {
          name: block.name,
          type: block.type,
          placeholder: block.placeholder || false,
          content: []
        };
        return this;
      },
      writable: true,
      configurable: true
    },
    openBlock: {

      // Open a block, and start adding content to it.
      value: function openBlock(name) {
        if (!this.hasBlock(name)) {
          this.addError("Cannot open blocks that do not exist: " + name).exit();
          return this;
        }
        this._openBlocks.push(name);
        this._openBlock = name;
        return this;
      },
      writable: true,
      configurable: true
    },
    hasBlock: {
      value: function hasBlock(block) {
        return !!this._blocks[block];
      },
      writable: true,
      configurable: true
    },
    getBlock: {

      // Get a block by name
      value: function getBlock(block) {
        return this._blocks[block];
      },
      writable: true,
      configurable: true
    },
    appendBlockToContent: {

      // Insert a block into the output
      value: function appendBlockToContent(name) {
        var block = this.getBlock(name);
        if (!block) {
          this.setError("No block found: " + name).exit();
          return this;
        }
        var content = block.content.join("");
        if (block.placeholder) {
          var output = this.getOutput().replace("@PLACEHOLDER" + block.name + "@", content);
          this.setOutput(output);
        } else {
          this.appendOutput(content);
        }
        return this;
      },
      writable: true,
      configurable: true
    },
    closeOpenBlock: {

      // Close the last opened block, and set the parent block
      // to active (if applicable)
      value: function closeOpenBlock() {
        var block = this.getOpenBlock();
        this._openBlocks.pop();
        this._openBlock = this._openBlocks.length > 0 ? this._openBlocks[this._openBlocks.length - 1] : "";
        if (block && "block" === block.type) {
          this.appendBlockToContent(block.name);
        }
        return this;
      },
      writable: true,
      configurable: true
    },
    getOpenBlock: {

      // Get the current open block
      value: function getOpenBlock() {
        return this.getBlock(this._openBlock);
      },
      writable: true,
      configurable: true
    },
    getTokens: {
      value: function getTokens() {
        return this._tokens;
      },
      writable: true,
      configurable: true
    },
    getLoader: {
      value: function getLoader() {
        return this._loader;
      },
      writable: true,
      configurable: true
    },
    appendOutput: {

      // Add content to the output
      value: function appendOutput(str) {
        if (str) {
          var block = this.getOpenBlock();
          if (block && "block" === block.type) {
            block.content.push(str);
          } else {
            this._output += str;
          }
        }
        return this;
      },
      writable: true,
      configurable: true
    },
    getOutput: {

      // Get the raw content
      value: function getOutput() {
        return this._output;
      },
      writable: true,
      configurable: true
    },
    setOutput: {

      // Overwrite all content
      value: function setOutput(content) {
        this._output = content;
        return this;
      },
      writable: true,
      configurable: true
    },
    getTemplate: {

      // Get the compiled template
      value: function getTemplate() {
        return this._template;
      },
      writable: true,
      configurable: true
    },
    setTemplateName: {
      value: function setTemplateName(name) {
        this._templateName = name;
        return this;
      },
      writable: true,
      configurable: true
    },
    getTemplateName: {
      value: function getTemplateName() {
        return this._templateName;
      },
      writable: true,
      configurable: true
    },
    setError: {

      // Add an error to the stack
      value: function setError(err) {
        this._errors.push(err);
        return this;
      },
      writable: true,
      configurable: true
    },
    hasErrors: {

      // Check if any errors were thrown during compiling
      value: function hasErrors() {
        return this._errors.length > 0;
      },
      writable: true,
      configurable: true
    },
    getErrors: {

      // Get all errors
      value: function getErrors() {
        return this._errors;
      },
      writable: true,
      configurable: true
    },
    getLastWrappedError: {

      // Return the last error, and wrap it in an `Error` if needed
      value: function getLastWrappedError() {
        var err = this.getErrors().pop();
        if (err instanceof Error) {
          return err;
        }return new Error(err);
      },
      writable: true,
      configurable: true
    },
    setOnDone: {
      value: function setOnDone(fn) {
        this._onDone.push(fn);
        return this;
      },
      writable: true,
      configurable: true
    },
    getOnDone: {
      value: function getOnDone() {
        return this._onDone;
      },
      writable: true,
      configurable: true
    }
  });

  return Compiler;
})();

module.exports = Compiler;