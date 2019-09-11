import _ from 'lodash'

import {
  IDataNode,
  IPlugin,
  IPluginExecution,
} from '../../../../../typings'

const execution: IPluginExecution = () => {
  // return {
  //   fake: 'data'
  // }
}

export const mockData: IPlugin = {
  name: 'mock-data',
  categories: ['data.request.after'],
  execution,
  priority: 0,
}
