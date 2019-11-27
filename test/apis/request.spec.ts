/* global describe, it, before */
import chai from 'chai'
import engine from '../../src/helpers/APIEngine'

const expect = chai.expect

describe('Given an instance of request', () => {
  before(() => {})
  describe('test some functions', () => {
    // it('test injectInterceptor function', () => {
    //   engine.request.injectInterceptor('layout_id', true)
    // })
    it('test replaceLayout function', () => {
      engine.ui.layout.replaceWith('login.json', ['1', '2'])
    })
  })
})
