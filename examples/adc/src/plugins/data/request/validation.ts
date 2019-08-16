import _ from "lodash";
import { validateAll } from "uiengine";
import { IPluginFunc, IPlugin, IDataEngine } from "uiengine/typings";

/**
 * add prefix to data
 * @param dataEngine
 */
const callback: IPluginFunc = async (dataEngine: IDataEngine) => {
  // validation
  let errors: any = [];
  const validate = async (target: string) => {
    // validate all values
    if (target[target.length - 1] === ":") {
      const regExp = new RegExp(target);
      const errorInfos = await validateAll([regExp]);
      if (errorInfos.length) {
        errors = errors.concat(errorInfos);
      }
    }
  };

  if (dataEngine.source !== undefined) {
    await validate(dataEngine.source.source);
  }

  if (errors.length) {
    let couldRequest = true;
    errors.forEach((error: any) => {
      if (error.status !== true) couldRequest = false;
    });
    if (!couldRequest) return false;
  }
};

export const validation: IPlugin = {
  type: "data.request.could",
  weight: 100,
  callback,
  name: "validation"
};
