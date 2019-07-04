import { IPlugins } from "../../typings";
import PluginManager from "../data-layer/PluginManager";

export class UIEngineRegister {
  static componentsLibrary = {};

  static registerPlugins(plugins: IPlugins) {
    PluginManager.loadPlugins(plugins);
  }

  static registerComponents(components: any, libraryName?: string) {
    if (libraryName) {
      UIEngineRegister.componentsLibrary[libraryName] = components;
    } else {
      UIEngineRegister.componentsLibrary = components;
    }
  }
}
