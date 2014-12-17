Plus
====

A simple template system, similar to Handlebars.

```
{{+obj}}
  <div class="foo">
    {{.bar}}
  </div>
{{/obj}}
```

Inheritance
-----------
Plus allows for simple template inheritance using 'blocks' and 'placeholders'. 
A placeholder is indicated by a `=` tag:

```
{{=placeholder}}
```

Blocks use the `+` tag, and can be used without placeholders. However, if
a matching placeholder is found, the block will be rendered there
instead of where it appears in the template. For example, take the following:

```
{{=foo}} is a Bar {{+foo}}Foo{{/foo}}
```

When rendered, it will be output as `Foo is a Bar`, rather then `is a Bar Foo`.

Here's an example of how you might use these rules to create a
simple layout file ('layout/default.plus'):

```
{{# Default Layout }}

<header class="header">
  <div class="header-title">
    {{=header-title}}
  </div>
</header>

<div class="main">
  {{=content}}
</div>
```

We can import a layout file and extend it using the `>` tag. Here's an example of
a template that inherits the above layout:

```
{{# Example Template }}

{{> ../layout/default.plus }}

{{+header-title}}
  <h2>{{title}}</h2>
{{/header-title}}

{{+content}}
  <p>Some content goes here</p>
{{/content}}
```

You can include partials using the `>` tag. For example:

```
{{# Example Template }}

{{> ../layout/default.plus }}

{{+header-title}}
  <h2>{{title}}</h2>
{{/header-title}}

{{+content}}
  {{> ./partials/content.plus }}
{{/content}}
```

Note how nothing special is happening here: placeholder tags will ALWAYS
be replaced by a matching block, no matter where you write them.

(More to come)
