// import _ from "lodash";
import { IPluginFunc, IPlugin, IDataEngine } from "UIEngine/typings";

/**
 * add prefix to data
 * @param dataEngine
 */
const callback: IPluginFunc = (dataEngine: IDataEngine) => {
  const { endpoint = "" } = dataEngine.requestOptions;
  dataEngine.requestOptions.endpoint = endpoint.replace(/\{(.*?)\}/, "");
  return true;
};

export const urlFitter: IPlugin = {
  type: "data.request.could",
  priority: 100,
  callback,
  name: "urlFitter"
};
