var Class = require('util/simple-class')
var Scanner = require('./scanner')
var utils = require('./utils')

var Tokenizer = Class.extend({

  constructor: function (template, tags, delimiters) {
    this.raw = template
    this.tags = tags
    this.delimiters = delimiters
    this.tokens = []
    this._buildTags()
  },

  _buildTags: function () {
    this.openTag = new RegExp(utils.escapeRegExp(this.delimiters.open) + '\\s*')
    this.closeTag = new RegExp('\\s*' + utils.escapeRegExp(this.delimiters.close))
    var symbols = []
    var sorts = {}
    var self = this
    utils.each(this.tags, function (val, name) {
      if (name === 'DELIMITERS') return
      if (!val.tag) return
      symbols.push(val.tag)
      sorts[val.tag] = name
    })
    symbols.sort(function (a, b) {
      var aName = sorts[a]
      var bName = sorts[b]
      if (self.tags[aName].priority > self.tags[bName].priority) {
        return 1
      } else if (self.tags[aName].priority < self.tags[bName].priority) {
        return -1
      }
      return 0
    })
    utils.each(symbols, function (tag, index) {
      symbols[index] = utils.escapeRegExp(tag)
    })
    this.symbols = new RegExp(symbols.join('|'))
    this.tags = symbols
    this.tagNames = sorts
    // console.log(this.tagNames, this.symbols, this.tags)
  },

  parse: function () {
    var scanner = new Scanner(this.raw)

    while (!scanner.eos()) {
      var start = scanner.pos
      var value = scanner.scanUntil(this.openTag)

      if (value) {
        this.tokens.push({
          tag: 'txt',
          value: value,
          start: start,
          end: value.length
        })
      }

      if (!scanner.scan(this.openTag)) break

      var tagName = this.tagNames[scanner.scan(this.symbols)] || 'escape'
      var token = {}
      token.tag = tagName
      token.value = scanner.scanUntil(this.closeTag)
      if (!scanner.scan(this.closeTag)) 
        throw new Error('Unclosed tag at ' + scanner.pos)
      token.start = start
      token.end = scanner.pos
      this.tokens.push(token)
    }

    return this.tokens
  },

  // Helper to figure out what context to use for a local
  getContext: function (token) {
    var raw = (token.value || token)
    raw = raw.trim()
    var value = (this.blocks.length && (raw.indexOf('.') === 0))
      ? 'sub' + raw
      : 'ctx.' + raw
    return value
  }

})

module.exports = Tokenizer
