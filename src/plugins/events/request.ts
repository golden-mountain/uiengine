import _ from "lodash";
import { IUINode } from "../../../typings";
import { IPluginFunc, IPlugin } from "../../../typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  return (e: any, options: any) => {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    let target = `${options.target}:`;
    // console.log(options, uiNode.dataNode.dataPool.get(target, false));
    // const data = uiNode.dataNode.dataPool.get(target, false);
    uiNode.dataNode.submit([target], "post").then((result: any) => {
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
