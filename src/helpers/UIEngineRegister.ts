import _ from 'lodash'

import PluginManager from './PluginManager'
import { IPlugin, IPluginMap, IPluginManager } from '../../typings'

export class UIEngineRegister {
  static componentsLibrary = {}

  static registerPlugins(plugins: IPlugin[] | IPluginMap, manager?: IPluginManager) {
    if (_.isNil(manager)) {
      manager = PluginManager.getInstance()
    }
    if (_.isArray(plugins)) {
      manager.loadPlugins(plugins)
    } else {
      manager.loadPlugins(Object.values(plugins))
    }
  }

  static registerComponents(components: any, libraryName?: string) {
    if (libraryName) {
      UIEngineRegister.componentsLibrary[libraryName] = components
    } else {
      UIEngineRegister.componentsLibrary = components
    }
  }
}
