import _ from "lodash";
import { getDomainName } from "UIEngine";
import { IPluginFunc, IPlugin, IDataEngine } from "UIEngine/typings";

/**
 * add prefix to data
 * @param dataEngine
 */
const callback: IPluginFunc = (dataEngine: IDataEngine) => {
  const data = dataEngine.data;
  if (dataEngine.source !== undefined) {
    const sourceSegs = getDomainName(dataEngine.source, false).split(".");
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

    if (_.isEmpty(validData)) validData = data;
    _.set(result, validSegs, validData);
    return result;
  }
};

export const malform: IPlugin = {
  type: "data.request.after",
  priority: 100,
  callback,
  name: "malform"
};
