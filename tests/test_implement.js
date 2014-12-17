var expect = require('chai').expect
var fs = require('fs')
var path = require('path')
var Plus = require('../')
var loader = require('../examples/default-loader')

describe('Plus', function () {

  before(function () {
    Plus.setLoader(loader)
  })
  
  describe('#include (>)', function () {
    
    it('loads templates', function (done) {
      fs.readFile(path.join(__dirname, './fixtures/one.plus'), 'utf-8', function (err, file) {
        if (err) {
          done(err)
          return
        }
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

  describe('#extend (+>)', function () {

    it('extends templates', function (done) {

      fs.readFile(path.join(__dirname, './fixtures/test-layout.plus'), 'utf-8', function(err, file) {
        if (err) {
          done(err)
          return
        }

        fs.readFile(path.join(__dirname, './fixtures/test-layout-expected.html'), 'utf-8', function (err, expected) {
          if (err) {
            done(err)
            return
          }

          Plus.compile(path.join(__dirname, './fixtures/test-layout.plus'), file, function (err, tpl) {
            if (tpl) {
              var actual = tpl({
                header: {
                  title: 'Foo'
                },
                content: {
                  title: 'Bar',
                  items: [
                    {
                      title: 'item1',
                      content: 'stuff'
                    },
                    {
                      title: 'item2',
                      content: 'stuff'
                    }
                  ]
                }
              })
              expect(actual).to.equal(expected)
            }
            done(err)
          })

        })

      })

    })

  })


})
