var utils = require('./utils')

exports.DELIMITERS = {
  open: '{{',
  close: '}}'
}

// Inheritance
// -----------
exports.include = {
  tag: '>',
  priority: 0,
  handler: function (token, compiler) {
    compiler.addDependency(token.value)
    compiler.write('\';\n__t+=__runtime.includeTemplate("' + token.value + '", ctx);\n__t+=\'')
  }
}

// Blocks
// ------
exports.block = {
  tag: '+',
  priority: 1,
  handler: function (token, compiler) {
    var value = compiler.getContext(token)
    compiler.blocks.push(token)
    compiler.write('\';\n__runtime.block(ctx, ' + value + ', function (ctx, sub) {\n__t+=\'')
  }
}

exports.end = {
  tag: '/',
  priority: 1,
  handler: function (token, compiler) {
    var index = compiler.blocks.indexOf(token.value)
    if ("undefined" !== typeof index && token.value !== undefined) {
      compiler.blocks.splice(index, 1)
    } else {
      throw new Error('Unclosed block: ' + token.value)
    }
    compiler.write('\';\n});\n__t+=\'')
  }
}

// Conditionals
// ------------
exports.elif = {
  tag: '?',
  priority: 0,
  handler: function (token, compiler) {
    var value = compiler.getContext(token)
    compiler.blocks.push(token)
    compiler.write('\';\n__runtime.elif(ctx, ' + value + ', function (ctx){\n__t+=\'')
  }
}

exports.negate = {
  tag: '!',
  priority: 1,
  handler: function (token, compiler) {
    compiler.write('\';\n}, function (ctx) {\n__t+=\'')
  }
}

// Output
// ------
exports.unescaped = {
  tag: '-',
  priority: 1,
  handler: function (token, compiler) {
    var value = compiler.getContext(token)
    compiler.write('\'+(' + value + '||\'\')+\'')
  }
}

exports.escape = {
  tag: null,
  priority: 2,
  handler: function (token, compiler) {
    if (token.value.indexOf('(') > 0) {
      // Compile as a helper.
      var helper = token.value.replace(/\(([\s\S]+?)\)/g, function (match, args) {
        var argsParsed = args.split(',')
        return '(' + utils.each(argsParsed, function (arg, index) {
          if( arg.indexOf('"') >= 0 || arg.indexOf("'") >= 0) {
            argsParsed[index] = utils.escapeJS(arg)
            return
          }
          argsParsed[index] = compiler.getContext(arg)
        }).join(',') + ')'
      })
      compiler.write('\'+__runtime.escapeHtml(__runtime.' + helper + '||\'\')+\'')
      return
    }
    var value = compiler.getContext(token)
    compiler.write('\'+__runtime.escapeHtml(' + value + '||\'\')+\'')
  }
}

exports.txt = {
  tag: null,
  priority: 2,
  handler: function (token, compiler) {
    compiler.write('\'+\'' + utils.escapeJS(token.value) + '\'+\'')
  }
}
