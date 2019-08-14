import _ from "lodash";
import { IPluginFunc, IPlugin, INodeController } from "UIEngine/typings";
import { DataPool } from "UIEngine";

/**
 * could we commit
 * @param nodeController
 */
const callback: IPluginFunc = (
  nodeController: INodeController,
  options?: any
) => {
  const dataPool = DataPool.getInstance();

  // const allError = { status: false, code: 'Please make sure every items are good, then submit again'};
  if (_.has(options, "source")) {
    // any errors?
    const errors = dataPool.getError(options.source);
    const isError = _.isEmpty(errors);
    return isError;
  }

  return true;
};

export const could: IPlugin = {
  type: "data.commit.workflow.could",
  weight: 100,
  callback,
  name: "could"
};
