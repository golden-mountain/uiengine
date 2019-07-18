import _ from "lodash";
import { submitToAPI } from "../../helpers";
import { IPluginFunc, IPlugin, IUINode } from "../../../typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  return (e: any, options: any) => {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    let target = `${options.target}:`;
    // console.log(options, uiNode.dataNode.dataPool.get(target, false));
    // const data = uiNode.dataNode.dataPool.get(target, false);
    submitToAPI([{ source: target }], "post").then((result: any) => {
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
