import _ from "lodash";
import { stateDepsResolver } from "../state-helper";
import { IPluginFunc, IPlugin, IStateNode } from "../../../typings";

const callback: IPluginFunc = async (stateNode: IStateNode) => {
  return await stateDepsResolver(stateNode, "visible");
};

export const visible: IPlugin = {
  type: "state.resolver",
  weight: 0,
  callback,
  name: "visible"
};
