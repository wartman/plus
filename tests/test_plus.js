var expect = require('chai').expect
var Plus = require('../')

describe('Plus', function () {

  describe('#compile', function () {

    it('compiles a plus template', function () {
      var tpl = Plus.compile('{{foo}} and {{bar}}')
      expect(tpl({
        foo: 'foo',
        bar: 'bar'
      })).to.equal('foo and bar')
    })

  })

})

describe('tags', function () {

  var locals = {
    foo: 'foo',
    tru: true,
    fls: false,
    obj: {
      foo: 'foo',
      bar: 'bar'
    },
    arr: [
      'foo',
      'bar'
    ]
  }

  describe('#block (+)', function () {

    it('iterates over an object', function () {
      var tpl = Plus.compile('{{+obj}}{{.foo}}{{.bar}}{{/obj}}')
      expect(tpl(locals)).to.equal('foobar')
    })

    it('can be nested', function () {
      var tpl = Plus.compile('{{+obj}}{{.foo}}{{+.sub}}{{.foo}}{{/.sub}}{{/obj}}')
      expect(tpl({
        obj: {
          foo: 'foo',
          sub: {
            foo: 'bar'
          }
        }
      })).to.equal('foobar')
    })

  })

  describe('#elif (?)', function () {

    it('is conditional', function () {
      var tpl = Plus.compile('{{?tru}}true{{/}}{{?fls}}false{{/}}')
      expect(tpl(locals)).to.equal('true')
    })

    it('can be negated', function () {
      var tpl = Plus.compile('{{?fls}}false{{!}}true{{/}}')
      expect(tpl(locals)).to.equal('true')
    })

  })

  describe('#include (>)', function () {

    it('includes other templates', function () {
      Plus.compile('foo', '{{+obj}}[inner {{.bar}}]{{/obj}}')
      var tpl = Plus.compile('{{foo}}{{>foo}}')
      expect(tpl(locals)).to.equal('foo[inner bar]')
    })

  })

})