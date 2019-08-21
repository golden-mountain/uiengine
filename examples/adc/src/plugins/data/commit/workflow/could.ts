import _ from "lodash";
import { IPluginFunc, IPlugin, INodeController } from "uiengine/typings";
import { DataPool } from "uiengine";

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
  priority: 100,
  callback,
  name: "could"
};
