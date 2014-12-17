import {each, escapeJS} from './utils'

// Delimiters
// ----------
export var delimiters = {
  open: '{{',
  close: '}}'
}

// Tags
// ----
export var tags = {}

// Comments
// --------
tags.comment = {
  tag: '#',
  priority: 0,
  handler(token, compiler) {
    // Just ignore
    compiler.next()
  }
}

// Inheritance
// -----------
tags.include = {
  tag: '>',
  priority: 0,
  handler(token, compiler) {
    var loader = compiler.getLoader()
    if (!loader) {
      compiler.setError('No loader registered').exit()
      return
    }
    var path = loader.resolve(token.value, compiler.getTemplateName())
    loader.load(path, (err, template) => {
      if (err) {
        compiler.setError(err).exit()
        return
      }
      compiler.pipe(template).next()
    })
  }
}

// Blocks
// ------
tags.block = {
  tag: '+',
  priority: 1,
  handler(token, compiler) {
    var value = compiler.parseContext(token)
    // Don't overwrite placeholders
    // @todo: This will probably break horribly if two blocks of the same name are 
    // added. Only overwrite placeholders, other blocks should be aliased with a
    // unique id somehow.
    if (!compiler.hasBlock(token.value) || !compiler.getBlock(token.value).placeholder) {
      compiler.addBlock({
        name: token.value,
        type: 'block'
      })
    }
    compiler.openBlock(token.value)
    compiler.write('\';\n__runtime.block(ctx, ' + value + ', function (ctx, sub) {\n__t+=\'')
  }
}

tags.placeholder = {
  tag: '=',
  priority: 1,
  handler(token, compiler) {
    compiler.addBlock({
      name: token.value,
      type: 'block',
      placeholder: true
    })
    compiler.writePlaceholder(token.value)
  }
}

tags.end = {
  tag: '/',
  priority: 1,
  handler(token, compiler) {
    var currentBlock = compiler.getOpenBlock()
    // Generic blocks must be named when closed (e.g. `{{+foo}}...{{/foo}})
    // while `ifelse` blocks may be closed anonymously (e.g, `{{?foo}}...{{/}})
    if (!currentBlock) {
      compiler
        .setError('No open block: ' + token.value || "[anonymous]")
        .exit()
      return
    } else if ('block' === currentBlock.type && currentBlock.name === token.value) {
      var output = '\';\n}'
      if (currentBlock.placeholder) output += ',{placeholder:true}'
      output += ');\n__t+=\''
      compiler
        .appendOutput(output)
        .closeOpenBlock()
    } else if ('ifelse' === currentBlock.type) {
      compiler
        .appendOutput('\';\n});\n__t+=\'')
        .closeOpenBlock()
    } else {
      compiler
        .setError('Unclosed block: ' + currentBlock.name)
        .exit()
      return
    }
    compiler.next()
  }
}

// Conditionals
// ------------
tags.ifelse = {
  tag: '?',
  priority: 0,
  handler(token, compiler) {
    compiler.addBlock({
      name: token.value,
      type: 'ifelse'
    })
    compiler.openBlock(token.value)
    var value = compiler.parseContext(token)
    compiler.write('\';\n__runtime.ifelse(ctx, ' + value + ', function (ctx){\n__t+=\'')
  }
}

tags.negate = {
  tag: '!',
  priority: 1,
  handler(token, compiler) {
    var currentBlock = compiler.getOpenBlock()
    if (!currentBlock) {
      compiler
        .setError('No open block: ' + token.value)
        .exit()
      return
    } else if (currentBlock.type === 'block' && currentBlock.name != token.value) {
      compiler
        .setError('Unexpected symbol "!": ' + token.value)
        .exit()
      return
    }
    compiler.write('\';\n}, function (ctx) {\n__t+=\'')
  }
}

// Output
// ------
tags.unescaped = {
  tag: '-',
  priority: 1,
  handler(token, compiler) {
    var value = compiler.parseContext(token)
    compiler.write('\'+(' + value + '||\'\')+\'')
  }
}

tags.escape = {
  tag: null,
  priority: 2,
  handler(token, compiler) {
    if (token.value.indexOf('(') > 0) {
      // Compile as a helper.
      var helper = token.value.replace(/\(([\s\S]+?)\)/g, (match, args) => {
        var argsParsed = args.split(',')
        return '(' + each(argsParsed, (arg, index) => {
          if( arg.indexOf('"') >= 0 || arg.indexOf("'") >= 0) {
            argsParsed[index] = escapeJS(arg)
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

tags.txt = {
  tag: null,
  priority: 2,
  handler(token, compiler) {
    compiler.write('\'+\'' + escapeJS(token.value) + '\'+\'')
  }
}
