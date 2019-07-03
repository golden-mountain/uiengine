import _ from "lodash";
import { IPluginFunc, IPlugin, IDataEngine } from "UIEngine/typings";

/**
 * add prefix to data
 * @param dataEngine
 */
const callback: IPluginFunc = (dataEngine: IDataEngine) => {
  const data = dataEngine.data;
  // console.log(data, dataEngine.source);
  if (dataEngine.source !== undefined) {
    const sourceSegs = dataEngine.source.replace(".json", "").split(/[.|/]/);
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
  weight: 100,
  callback,
  name: "malform"
};
