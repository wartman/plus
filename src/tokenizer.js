import Scanner from './scanner'
import {each, escapeRegExp} from './utils'

// A cache for tags, so they only need to be built once.
var _tagsCache = {
  built: false,
  symbols: {},
  tags: {},
  tagNames: {},
  openTag: '',
  closeTag: ''
}

// Tokenizer
// ---------
class Tokenizer {

  constructor(template, tags) {
    this._raw = template
    this._tags = tags
    this._delimiters = tags.DELIMITERS
    this._tokens = []
    this._buildTags()
  }

  _buildTags() {
    var symbols = []
    var sorts = {}
    var self = this
    if (_tagsCache.built) {
      this._symbols = _tagsCache.symbols
      this._tags = _tagsCache.tags
      this._tagNames = _tagsCache.tagNames
      this._openTag = _tagsCache.openTag
      this._closeTag = _tagsCache.closeTag
      return
    }
    this._openTag = _tagsCache.openTag = new RegExp(escapeRegExp(this._delimiters.open) + '\\s*')
    this._closeTag = _tagsCache.closeTag = new RegExp('\\s*' + escapeRegExp(this._delimiters.close))
    each(this._tags, (val, name) => {
      if (name === 'DELIMITERS') return
      if (!val.tag) return
      symbols.push(val.tag)
      sorts[val.tag] = name
    })
    symbols.sort((a, b) => {
      var aName = sorts[a]
      var bName = sorts[b]
      if (self._tags[aName].priority > self._tags[bName].priority) {
        return 1
      } else if (self._tags[aName].priority < self._tags[bName].priority) {
        return -1
      }
      return 0
    })
    each(symbols,(tag, index) => {
      symbols[index] = escapeRegExp(tag)
    })
    this._symbols = _tagsCache.symbols = new RegExp(symbols.join('|'))
    this._tags = _tagsCache.tags = symbols
    this._tagNames = _tagsCache.tagNames = sorts
    _tagsCache.built = true
    // console.log(this._tagNames, this._symbols, this._tags)
  }

  parse() {
    var scanner = new Scanner(this._raw)

    while (!scanner.eos()) {
      var start = scanner.pos
      var value = scanner.scanUntil(this._openTag)

      if (value) {
        this._tokens.push({
          tag: 'txt',
          value: value,
          start: start,
          end: value.length
        })
      }

      if (!scanner.scan(this._openTag)) break

      var tagName = this._tagNames[scanner.scan(this._symbols)] || 'escape'
      var token = {}
      token.tag = tagName
      token.value = scanner.scanUntil(this._closeTag)
      if (!scanner.scan(this._closeTag)) 
        throw new Error('Unclosed tag at ' + scanner.pos)
      token.start = start
      token.end = scanner.pos
      this._tokens.push(token)
    }
    return this._tokens
  }

  getTokens() {
    return this._tokens
  }

}

export default Tokenizer
