"use strict";

var _utils = require("./utils");

var each = _utils.each;
var escapeJS = _utils.escapeJS;


// Delimiters
// ----------
var delimiters = exports.delimiters = {
  open: "{{",
  close: "}}"
};

// Tags
// ----
var tags = exports.tags = {};

// Comments
// --------
tags.comment = {
  tag: "#",
  priority: 0,
  handler: function handler(token, compiler) {
    // Just ignore
    compiler.next();
  }
};

// Inheritance
// -----------
tags.include = {
  tag: ">",
  priority: 0,
  handler: function handler(token, compiler) {
    var loader = compiler.getLoader();
    if (!loader) {
      compiler.setError("No loader registered").exit();
      return;
    }
    var path = loader.resolve(token.value, compiler.getTemplateName());
    loader.load(path, function (err, template) {
      if (err) {
        compiler.setError(err).exit();
        return;
      }
      compiler.pipe(template).next();
    });
  }
};

// Blocks
// ------
tags.block = {
  tag: "+",
  priority: 1,
  handler: function handler(token, compiler) {
    var value = compiler.parseContext(token);
    // Don't overwrite placeholders
    // @todo: This will probably break horribly if two blocks of the same name are
    // added. Only overwrite placeholders, other blocks should be aliased with a
    // unique id somehow.
    if (!compiler.hasBlock(token.value) || !compiler.getBlock(token.value).placeholder) {
      compiler.addBlock({
        name: token.value,
        type: "block"
      });
    }
    compiler.openBlock(token.value);
    compiler.write("';\nrt.runBlock('block',locals,{context:" + value + ",fn:function(locals, sub){\nout+='");
  }
};

tags.placeholder = {
  tag: "=",
  priority: 1,
  handler: function handler(token, compiler) {
    compiler.addBlock({
      name: token.value,
      type: "block",
      placeholder: true
    });
    compiler.writePlaceholder(token.value);
  }
};

tags.end = {
  tag: "/",
  priority: 1,
  handler: function handler(token, compiler) {
    var currentBlock = compiler.getOpenBlock();
    // Generic blocks must be named when closed (e.g. `{{+foo}}...{{/foo}})
    // while `ifelse` blocks may be closed anonymously (e.g, `{{?foo}}...{{/}})
    if (!currentBlock) {
      compiler.setError("No open block: " + token.value || "[anonymous]").exit();
      return;
    } else if ("block" === currentBlock.type && currentBlock.name === token.value) {
      var output = "';\n}";
      if (currentBlock.placeholder) output += ",placeholder:true";
      output += "});\nout+='";
      compiler.appendOutput(output).closeOpenBlock();
    } else if ("ifelse" === currentBlock.type) {
      compiler.appendOutput("';\n}});\nout+='").closeOpenBlock();
    } else {
      compiler.setError("Unclosed block: " + currentBlock.name).exit();
      return;
    }
    compiler.next();
  }
};

// Conditionals
// ------------
tags.ifelse = {
  tag: "?",
  priority: 0,
  handler: function handler(token, compiler) {
    compiler.addBlock({
      name: token.value,
      type: "ifelse"
    });
    compiler.openBlock(token.value);
    var value = compiler.parseContext(token);
    compiler.write("';\nrt.runBlock('if',locals,{context:" + value + ",fn:function(locals){\nout+='");
  }
};

tags.negate = {
  tag: "!",
  priority: 1,
  handler: function handler(token, compiler) {
    var currentBlock = compiler.getOpenBlock();
    if (!currentBlock) {
      compiler.setError("No open block: " + token.value).exit();
      return;
    } else if (currentBlock.type === "block" && currentBlock.name != token.value) {
      compiler.setError("Unexpected symbol \"!\": " + token.value).exit();
      return;
    }
    compiler.write("';\n},inverse:function(locals){\nout+='");
  }
};

// Output
// ------
tags.unescaped = {
  tag: "-",
  priority: 1,
  handler: function handler(token, compiler) {
    var value = compiler.parseContext(token);
    compiler.write("'+rt.unescapedHtml(" + value + ")+'");
  }
};

tags.escape = {
  tag: null,
  priority: 2,
  handler: function handler(token, compiler) {
    if (token.value.indexOf("(") > 0) {
      // Compile as a helper.
      var helper = token.value.replace(/\(([\s\S]+?)\)/g, function (match, args) {
        var argsParsed = args.split(",");
        return "(" + each(argsParsed, function (arg, index) {
          if (arg.indexOf("\"") >= 0 || arg.indexOf("'") >= 0) {
            argsParsed[index] = escapeJS(arg);
            return;
          }
          argsParsed[index] = compiler.parseContext(arg);
        }).join(",") + ")";
      });
      compiler.write("'+rt.escapeHtml(rt." + helper + ")+'");
      return;
    }
    var value = compiler.parseContext(token);
    compiler.write("'+rt.escapeHtml(" + value + ")+'");
  }
};

tags.txt = {
  tag: null,
  priority: 2,
  handler: function handler(token, compiler) {
    compiler.write("'+'" + escapeJS(token.value) + "'+'");
  }
};
Object.defineProperty(exports, "__esModule", {
  value: true
});