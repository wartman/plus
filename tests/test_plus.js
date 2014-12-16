var expect = require('chai').expect
var Plus = require('../')

describe('Plus', function () {

  describe('#compile', function () {

    it('compiles a plus template', function (done) {
      Plus.compile('{{foo}} and {{bar}}', function (err, tpl) {
        if (tpl) {
          expect(tpl({
            foo: 'foo',
            bar: 'bar'
          })).to.equal('foo and bar')
        }
        done(err)
      })
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

    it('iterates over an object', function (done) {
      Plus.compile('{{+obj}}{{.foo}}{{.bar}}{{/obj}}', function (err, tpl) {
        if (tpl) expect(tpl(locals)).to.equal('foobar')
        done(err)
      })
    })

    it('can be nested', function (done) {
      Plus.compile('{{+obj}}{{.foo}}{{+.sub}}{{.foo}}{{/.sub}}{{/obj}}', function (err, tpl) {
        if (tpl) {
          expect(tpl({
            obj: {
              foo: 'foo',
              sub: {
                foo: 'bar'
              }
            }
          })).to.equal('foobar')
        }
        done(err)
      })
    })

    it('throws an error if not wrapped correctly', function (done) {
      Plus.compile('{{+obj}}{{.foo}}{{/}}', function (err, tpl) {
        expect(err.message).to.equal('Unclosed block: obj')
        done()
      })
    })

  })

  describe('#ifelse (?)', function () {

    it('can use an anonymous close tag', function (done) {
      Plus.compile('{{?tru}}true{{/}}', function (err, tpl) {
        if (tpl) expect(tpl(locals)).to.equal('true')
        done(err)
      })
    })

    it('can use a named close tag', function (done) {
      Plus.compile('{{?tru}}true{{/tru}}', function (err, tpl) {
        if (tpl) expect(tpl(locals)).to.equal('true')
        done(err)
      })
    })

    it('is conditional', function (done) {
      Plus.compile('{{?tru}}true{{/}}{{?fls}}false{{/}}', function (err, tpl) {
        if (tpl) expect(tpl(locals)).to.equal('true')
        done(err)
      })
    })

    it('can be negated', function (done) {
      Plus.compile('{{?fls}}false{{!}}true{{/}}', function (err, tpl) {
        if (tpl) expect(tpl(locals)).to.equal('true')
        done(err)
      })
    })

  })

  describe('#include (>)', function () {

    it('includes other templates', function (done) {
      var fixtures = {
        foo: '{{+obj}}[inner {{.bar}}]{{/obj}}',
        bar: 'uh oh'
      }
      Plus.setLoader({
        resolve: function (to, from) {
          return to
        },
        load: function (path, next) {
          if (!fixtures[path]) {
            next(new Error('No template found: ' + path || 'undefined'))
            return
          }
          next(null, fixtures[path])
        }
      }).compile('{{foo}}{{>foo}}', function (err, tpl) {
        if (tpl) expect(tpl(locals)).to.equal('foo[inner bar]')
        done(err)
      })
    })

  })

})