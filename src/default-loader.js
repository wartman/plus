var fs = require('fs')
var path = require('path')

// Default Loader
// --------------
// This is the simplest implementation of a template
// loader system
var defaultLoader = {

  resolve: function (to, from) {
    to = to.trim()
    from = path.dirname(from)
    return path.resolve(from, to) + '.plus'
  },

  load: function (path, next) {
    fs.readFile(path, 'utf-8', next)
  }

}

module.exports = defaultLoader