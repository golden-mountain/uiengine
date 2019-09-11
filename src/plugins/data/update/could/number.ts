import _ from 'lodash'

import {
  IDataNode,
  IPlugin,
  IPluginExecution,
  IPluginParam,
} from '../../../../../typings'

const execution: IPluginExecution = (param: IPluginParam) => {
  const dataNode: IDataNode = _.get(param, 'dataNode')
  if (_.isNil(dataNode)) {
    return null
  }
  const data = dataNode.data
  const schema = dataNode.getSchema()
  let result = true,
    errorMessage = ''
  if (_.get(schema, 'type') === 'number') {
    const { min, max } = schema

    const minMessage = `Data ${data} less than ${min}`
    const maxMessage = `Data ${data} max than ${max}`
    if (min !== undefined && max !== undefined) {
      result = data >= min && data <= max
      if (!result) errorMessage = `${minMessage}, ${maxMessage}`
    } else if (min !== undefined) {
      result = data >= min
      if (!result) errorMessage = minMessage
    } else if (max !== undefined) {
      result = data <= max
      if (!result) errorMessage = maxMessage
    }
  }
  return { status: result, code: errorMessage }
}

export const validate: IPlugin = {
  name: 'number',
  categories: ['data.update.could'],
  paramKeys: ['dataNode'],
  execution,
  priority: 0,
}
