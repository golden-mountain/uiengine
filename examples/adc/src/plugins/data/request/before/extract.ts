import _ from "lodash";
import {
  IPluginFunc,
  IPlugin,
  IPluginExecutionConfig,
  IDataEngine,
  IUINode
} from "UIEngine/typings";

/**
 * exclude data
 * @param dataEngine
 */
const callback: IPluginFunc = (dataEngine: IDataEngine) => {
  const { params } = dataEngine.requestOptions;
  const dataSource = dataEngine.source;
  if (!dataSource || !dataSource.source) {
    return true;
  }
  const dataLineage: string = _.trimEnd(dataSource.source, ":");
  const dataPath = dataLineage.split(".");
  dataPath.pop();
  const extractedData = _.get(params, dataPath);
  if (extractedData) {
    dataEngine.requestOptions.params = extractedData;
  }
  return true;
};

export const extract: IPlugin = {
  type: "data.request.before",
  priority: 199,
  callback,
  name: "extract"
};
