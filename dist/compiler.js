"use strict";

var Tokenizer = require('./tokenizer')["default"];


// Compiler
// --------
var Compiler = (function () {
  var Compiler = function Compiler(template, tags, loader) {
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
  };

  Compiler.prototype.compile = function (next) {
    var _this = this;
    return this.setOnDone(function () {
      _this._cleanupPlaceholders();
      var output = _this.getOutput();
      var err = null;
      if (_this.hasErrors()) {
        next(_this.getLastWrappedError());
        return;
      }
      output = "ctx || (ctx = {});\nvar __t='';\n__t+='" + output + "';\n return __t";
      try {
        _this._template = Function("ctx, __runtime", output);
      } catch (e) {
        err = e;
      }
      next(err, _this._template);
    }).pipe(this._raw).write();
  };

  Compiler.prototype.pipe = function (text) {
    var tokenizer = new Tokenizer(text, this._tags);
    var i, newTokens;
    tokenizer.parse();
    newTokens = tokenizer.getTokens();
    // Add tokens in reverse order
    for (i = (newTokens.length - 1); i >= 0; i--) {
      this._tokens.unshift(newTokens[i]);
    }
    return this;
  };

  Compiler.prototype.write = function (str) {
    this.appendOutput(str).next();
    return this;
  };

  Compiler.prototype.next = function () {
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
    tag.handler(token, this);
    return this;
  };

  Compiler.prototype.exit = function () {
    this._tokens = [];
    this.complete();
    return this;
  };

  Compiler.prototype.complete = function () {
    while (this._onDone.length) {
      var fn = this._onDone.pop();
      fn.apply(this, arguments);
    }
    return this;
  };

  Compiler.prototype.parseContext = function (token) {
    var raw = (token.value || token);
    raw = raw.trim();
    var value = ("." === raw.charAt(0)) ? "sub[\"" + raw.replace(".", "") + "\"]" : "ctx[\"" + raw + "\"]";
    return value;
  };

  Compiler.prototype.writePlaceholder = function (name) {
    this.write("@PLACEHOLDER" + name + "@");
    return this;
  };

  Compiler.prototype._cleanupPlaceholders = function () {
    var output = this.getOutput();
    output = output.replace(/\@PLACEHOLDER\s?\S+\@/g, "");
    this.setOutput(output);
    return this;
  };

  Compiler.prototype.addBlock = function (block) {
    this._blocks[block.name] = {
      name: block.name,
      type: block.type,
      placeholder: block.placeholder || false,
      content: []
    };
    return this;
  };

  Compiler.prototype.openBlock = function (name) {
    if (!this.hasBlock(name)) {
      this.addError("Cannot open blocks that do not exist: " + name).exit();
      return this;
    }
    this._openBlocks.push(name);
    this._openBlock = name;
    return this;
  };

  Compiler.prototype.hasBlock = function (block) {
    return !!this._blocks[block];
  };

  Compiler.prototype.getBlock = function (block) {
    return this._blocks[block];
  };

  Compiler.prototype.appendBlockToContent = function (name) {
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
  };

  Compiler.prototype.closeOpenBlock = function () {
    var block = this.getOpenBlock();
    this._openBlocks.pop();
    this._openBlock = (this._openBlocks.length > 0) ? this._openBlocks[(this._openBlocks.length - 1)] : "";
    if (block && "block" === block.type) {
      this.appendBlockToContent(block.name);
    }
    return this;
  };

  Compiler.prototype.getOpenBlock = function () {
    return this.getBlock(this._openBlock);
  };

  Compiler.prototype.getTokens = function () {
    return this._tokens;
  };

  Compiler.prototype.getLoader = function () {
    return this._loader;
  };

  Compiler.prototype.appendOutput = function (str) {
    if (str) {
      var block = this.getOpenBlock();
      if (block && "block" === block.type) {
        block.content.push(str);
      } else {
        this._output += str;
      }
    }
    return this;
  };

  Compiler.prototype.getOutput = function () {
    return this._output;
  };

  Compiler.prototype.setOutput = function (content) {
    this._output = content;
    return this;
  };

  Compiler.prototype.getTemplate = function () {
    return this._template;
  };

  Compiler.prototype.setTemplateName = function (name) {
    this._templateName = name;
    return this;
  };

  Compiler.prototype.getTemplateName = function () {
    return this._templateName;
  };

  Compiler.prototype.setError = function (err) {
    this._errors.push(err);
    return this;
  };

  Compiler.prototype.hasErrors = function () {
    return this._errors.length > 0;
  };

  Compiler.prototype.getErrors = function () {
    return this._errors;
  };

  Compiler.prototype.getLastWrappedError = function () {
    var err = this.getErrors().pop();
    if (err instanceof Error) return err;
    return new Error(err);
  };

  Compiler.prototype.setOnDone = function (fn) {
    this._onDone.push(fn);
    return this;
  };

  Compiler.prototype.getOnDone = function () {
    return this._onDone;
  };

  return Compiler;
})();

exports["default"] = Compiler;