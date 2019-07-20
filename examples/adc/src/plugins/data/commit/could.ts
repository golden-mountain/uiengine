// import _ from "lodash";
import { IPluginFunc, IPlugin, INodeController } from "UIEngine/typings";

/**
 * could we commit
 * @param nodeController
 */
const callback: IPluginFunc = (nodeController: INodeController) => {
  console.log(nodeController.activeLayout);
  // any errors?

  return false;
};

export const could: IPlugin = {
  type: "data.commit.could",
  weight: 100,
  callback,
  name: "could"
};
