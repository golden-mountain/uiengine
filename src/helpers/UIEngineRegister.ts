import _ from 'lodash'

import PluginManager from './PluginManager'
import ListenerManager from './ListenerManager'
import {
  IPlugin,
  IPluginMap,
  IPluginManager,
  IListenerConfig,
  IListenerMap,
  IListenerManager,
} from '../../typings'

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

  static registerListeners(listeners: IListenerConfig[] | IListenerMap, manager?: IListenerManager) {
    if (_.isNil(manager)) {
      manager = ListenerManager.getInstance()
    }
    if (_.isArray(listeners)) {
      manager.loadListeners(listeners)
    } else {
      manager.loadListeners(Object.values(listeners))
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
