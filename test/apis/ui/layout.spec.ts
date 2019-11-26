/* global describe, it, before */
import chai from 'chai'
import engine from '../../../src/helpers/APIEngine'

const expect = chai.expect

describe('Given an instance of layout', () => {
  before(() => {})
  describe('test functions', () => {
    // it('test select function', () => {
    //   engine.ui.layout('layout_id').select()
    // })
    it('test activateLayout function', () => {
      engine.ui.layout.active('layout_id', true)
    })
    it('test replaceLayout function', () => {
      engine.ui.layout.replaceWith('login.json', ['1', '2'])
    })
  })
})
