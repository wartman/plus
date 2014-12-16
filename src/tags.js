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
    var loader = compiler.getLoader()
    if (!loader) {
      compiler.setError('No loader registered')
      return
    }
    var path = loader.resolve(token.value, compiler.getTemplateName())
    loader.load(path, function (err, template) {
      if (err) {
        compiler.setError(err).exit()
        return
      }
      compiler
        .pipe(template)
        .next()
    })
  }
}

// Blocks
// ------
exports.block = {
  tag: '+',
  priority: 1,
  handler: function (token, compiler) {
    var value = compiler.parseContext(token)
    compiler.openBlock({
      name: token.value,
      type: 'block'
    })
    compiler.write('\';\n__runtime.block(ctx, ' + value + ', function (ctx, sub) {\n__t+=\'')
  }
}

exports.end = {
  tag: '/',
  priority: 1,
  handler: function (token, compiler) {
    var currentBlock = compiler.getOpenBlock()
    // Generic blocks must be named when closed (e.g. `{{+foo}}...{{/foo}})
    // while `ifelse` blocks may be closed anonymously (e.g, `{{?foo}}...{{/}})
    if (!currentBlock) {
      compiler
        .setError('No open block: ' + token.value || "[anonymous]")
        .exit()
      return
    } else if ('block' === currentBlock.type && currentBlock.name === token.value) {
      compiler.closeOpenBlock()
    } else if ('ifelse' === currentBlock.type) {
      compiler.closeOpenBlock()
    } else {
      compiler
        .setError('Unclosed block: ' + currentBlock.name)
        .exit()
      return
    }
    compiler.write('\';\n});\n__t+=\'')
  }
}

// Conditionals
// ------------
exports.ifelse = {
  tag: '?',
  priority: 0,
  handler: function (token, compiler) {
    compiler.openBlock({
      name: token.value,
      type: 'ifelse'
    })
    var value = compiler.parseContext(token)
    compiler.write('\';\n__runtime.ifelse(ctx, ' + value + ', function (ctx){\n__t+=\'')
  }
}

exports.negate = {
  tag: '!',
  priority: 1,
  handler: function (token, compiler) {
    var currentBlock = compiler.getOpenBlock()
    if (!currentBlock) {
      compiler
        .setError('No open block: ' + token.value)
        .exit()
      return
    } else if (currentBlock.type === 'block' && currentBlock.name != token.value) {
      compiler
        .setError('Unclosed block: ' + token.value)
        .exit()
      return
    }
    compiler.write('\';\n}, function (ctx) {\n__t+=\'')
  }
}

// Output
// ------
exports.unescaped = {
  tag: '-',
  priority: 1,
  handler: function (token, compiler) {
    var value = compiler.parseContext(token)
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
          argsParsed[index] = compiler.parseContext(arg)
        }).join(',') + ')'
      })
      compiler.write('\'+__runtime.escapeHtml(__runtime.' + helper + '||\'\')+\'')
      return
    }
    var value = compiler.parseContext(token)
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
