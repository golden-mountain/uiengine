import _ from "lodash";
import { IPluginFunc, IPlugin, IDataEngine } from "UIEngine/typings";

/**
 * add prefix to data
 * @param dataEngine
 */
const callback: IPluginFunc = (dataEngine: IDataEngine) => {
  const data = dataEngine.data;
  // console.log(data, dataEngine.source);
  const sourceSegs = dataEngine.source.split(/[\.|\/]/);
  let result: any = {};
  let validSegs: any = [];
  let validData: any = {};
  for (let index in sourceSegs) {
    validSegs.push(sourceSegs[index]);
    if (_.has(data, sourceSegs[index])) {
      validData = _.get(data, sourceSegs[index]);
      break;
    }
  }
  _.set(result, validSegs, validData);
  return result;
};

export const malform: IPlugin = {
  type: "data.request.after",
  initialize: 100,
  callback,
  name: "malform"
};
