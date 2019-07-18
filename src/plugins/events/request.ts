import _ from "lodash";
import { IPluginFunc, IPlugin, IUINode } from "../../../typings";
import { NodeController } from "../../data-layer";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  return (e: any, options: any) => {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    const nodeController = NodeController.getInstance();
    let target = `${options.target}:`;
    // console.log(options, uiNode.dataNode.dataPool.get(target, false));
    // const data = uiNode.dataNode.dataPool.get(target, false);
    nodeController.workflow.submit([{ source: target }]).then((result: any) => {
      console.log(result);
    });
  };
};

export const request: IPlugin = {
  type: "ui.parser.event",
  weight: 0,
  callback,
  name: "request"
};
