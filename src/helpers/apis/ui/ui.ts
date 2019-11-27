import _ from 'lodash'
import { createInstanceProxy } from '../../APIEngine'
import layout from './layout'
import { schema } from './schema'
import { data } from '../data'
import { state } from '../state'
import { IApiUI } from '../../../../typings/apis'
import { IObject, IWorkingMode, IUINode, INodeProps } from '../../../../typings'
import { searchNodes } from '../../utils'
import { NodeController } from '../../../../src/data-layer'
import { Workflow } from '../../../helpers'
class UINodeProxy {
  // private instance: any
  private node: any
  schema = schema
  data = data
  state = state
  layout = layout
  selector: object
  layoutKey?: string
  constructor(selector: object, layoutKey?: string) {
    this.selector = selector
    this.layoutKey = layoutKey
    this.node = null
    // this.instance = null
  }

  // selector could be an IUINodeProxyNode or SchemaSelector
  // select(selector: object, layoutKey?: string) {
  //   // fetch UINodeProxyNode
  // }

  // Named as search is better
  select() {
    return searchNodes(this.selector, this.layoutKey)
  }
  switchWorkingMode() {
    if (
      _.has(this.selector, 'mode') ||
      _.has(this.selector, 'operationModes') ||
      _.has(this.selector, 'options')
    ) {
      let workingMode: IWorkingMode
      // _.set(
      //   workingMode,
      //   (this.selector = {
      //     mode: _.get(this.selector, 'mode', null),
      //     operationModes: _.get(this.selector, 'operationModes', null),
      //     options: _.get(this.selector, 'options', null)
      //   })
      // )
      // _.set()
      // TODO
      // this.UINodeProxySetCallback(workingMode: IWorkingMode, )
      // return NodeController.getInstance().setWorkingMode(
      //   workingMode,
      //   this.layoutKey
      // )
    } else {
      return NodeController.getInstance().getWorkingMode(this.layoutKey)
    }
  }
  // Named as remove is better
  delete() {
    let nodes: Array<IUINode> | INodeProps = this.selector
    return Workflow.getInstance().removeNodes(nodes)
  }
  update(values: any) {}
  info(name: string) {}
  prop(name: string) {}
  parent(selector: any) {}
  children(selector: any) {}
  siblings(selector: any) {}
  closest(selector: any) {}
}

// callbacks
const UINodeProxyGetCallback = function(target: any, key: string) {
  if (!_.isNil(target[key])) {
    return target[key]
  }

  return _.get(target.node, key)
}

const UINodeProxySetCallback = function(target: any, key: string, value: any) {
  return _.set(target.node, key, value)
}

export const ui = <IApiUI>function(selector: any, layoutKey?: string) {
  return createInstanceProxy<
    IApiUI
  >(new UINodeProxy(selector, layoutKey), UINodeProxyGetCallback, UINodeProxySetCallback)
}

// access directly
ui.schema = schema
ui.data = data
ui.state = state
ui.layout = layout

// New added

// export const ui: IObject = {}
// export const ui = (selector: object, layoutKey?: string) => {

// }
// ui.select = ui('selector', 'id').select()

// ui.select = (prop: object, layoutKey?: string) => {
//   return searchNodes(prop, layoutKey)
// }
//  engine.ui({id: "any_id_you_defined"}, 'layout_id');
