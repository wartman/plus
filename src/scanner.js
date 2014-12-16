// Scanner
// -------
class Scanner {

  constructor(string) {
    this.string = string
    this.tail = string
    this.pos = 0
  }

  eos() {
    return this.tail === ''
  }

  // Try to match the passed regular expression at the current position.
  scan(re) {
    var match = this.tail.match(re)
    if (!match || match.index !== 0) return ''
    var string = match[0]
    this.tail = this.tail.substring(string.length)
    this.pos += string.length
    return string
  }

  // Skip text until the given expression is matched.
  scanUntil(re) {
    var index = this.tail.search(re), match
    switch (index) {
      case -1:
        match = this.tail
        this.tail = ""
        break
      case 0:
        match = ""
        break
      default:
        match = this.tail.substring(0, index)
        this.tail = this.tail.substring(index)
    }
    this.pos += match.length
    return match
  }

}

export default Scanner
