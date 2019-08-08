import _ from "lodash";
import { NodeController } from "UIEngine";
import { IPluginFunc, IPlugin, IUINode } from "UIEngine/typings";

const callback: IPluginFunc = (uiNode: IUINode) => {
  return async (e: any, options: any) => {
    // console.log(options);
    const nodeCtroller = NodeController.getInstance();
    const workflow = nodeCtroller.workflow;
    const workingMode = nodeCtroller.getWorkingMode();
    if (_.has(workingMode, "options.source")) {
      const connectOptions = _.get(workingMode, "options.source");
      const result = await workflow.submitToPool(connectOptions);

      if (result) {
        workflow.deactiveLayout();
      } else {
        // to write to a global notification
        console.error("Data should not empty when submitting");
      }
    }
  };
};

export const submitToPool: IPlugin = {
  type: "ui.parser.event",
  weight: 100,
  callback,
  name: "submitToPool"
};
