var expect = require('chai').expect
var fs = require('fs')
var path = require('path')
var Plus = require('../')
var loader = require('../examples/default-loader')

describe('Plus', function () {
  
  describe('#include (>)', function () {
    
    it('loads templates', function (done) {
      fs.readFile(path.join(__dirname, './fixtures/one.plus'), 'utf-8', function (err, file) {
        if (err) {
          done(err)
          return
        }
        Plus.setLoader(loader)
        Plus.compile(path.join(__dirname, './fixtures/one.plus'), file, function (err, tpl) {
          if (tpl) {
            expect(tpl({
              obj: {
                foo: 'foo',
                bar: 'bar'
              },
              foo: 'foo'
            })).to.equal('foo and [inner foobar]')
          }
          done(err)
        })
      })
    })

  })


})