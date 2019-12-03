import _ from "lodash";
import { UIEngineRegister } from "../../UIEngineRegister";
import { IPlugin, IPluginMap } from "../../../../typings";

function plugin(plugins?: any) {
  if (plugins) plugin.set(plugins);
}

plugin.set = (nameOrPlugins: IPlugin[] | IPluginMap, plugin?: IPlugin) => {
  UIEngineRegister.registerPlugins(nameOrPlugins);
};

plugin.get = (name: string) => {
  console.log(name);
};

export default plugin;
