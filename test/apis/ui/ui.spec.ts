/* global describe, it, before */
import chai from 'chai'
import engine from '../../../src/helpers/APIEngine'
import { IObject, IWorkingMode } from '../../../typings'
const expect = chai.expect
let uiNode = engine.ui({ id: 'test_id' }, 'layout_key')
// const uiNode = engine.ui.select({id: "any_id_you_defined"});
// // or full lineage way
// const uiNode = engine.ui.layout('layout-id').select({id: "any_id_you_defined"});
// // or if you have a uiNode, want use the functional way to operate it
// const newUiNode = engine.ui.select(uiNode)

describe('Given an instance of uiNode', () => {
  before(() => {})
  describe('test functions', () => {
    it('test select function', () => {
      uiNode.select()
    })
    it('test setWorkingMocde function', () => {
      let setWorkingMocde = engine.ui({ mode: 'new' })
      setWorkingMocde.switchWorkingMode()
    })
    it('test getWorkingMocde function', () => {
      let getWorkingMocde = engine.ui({ id: 'id' }, 'layout_key')
      getWorkingMocde.switchWorkingMode()
    })
    it('test delete function', () => {
      uiNode.delete()
    })
  })
})
