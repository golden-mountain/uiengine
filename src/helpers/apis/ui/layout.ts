import _ from 'lodash'
import { NodeController, UINode } from '../../../../src/data-layer'
import { IActivateLayoutOption, IObject, IUISchema } from '../../../../typings'
import { any } from 'prop-types'

const layout: IObject = {
  active: any,
  replaceWith: any
  // select: any
}
// layout.select = (layout_id?: string) => {
//   return layout.active(layout_id)
// }
layout.active = (
  layoutKey?: string | ((layoutsInActiveEngine?: string[]) => string),
  options?: IActivateLayoutOption
) => {
  return NodeController.getInstance().activateLayout(layoutKey, options)
}
layout.replaceWith = (newSchema: string | IUISchema, route?: number[]) => {
  const schema: IUISchema = {}
  const uiNode = new UINode(schema)
  return uiNode.replaceLayout(newSchema, route)
}

export default layout
