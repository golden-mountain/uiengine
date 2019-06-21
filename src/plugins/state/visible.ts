import _ from "lodash";
import {
  IState,
  IStateNode,
  StatePluginFunc
} from "../../../typings/StateNode";

export function visible(stateNode: IStateNode) {
  let result = true;
  const uiNode = stateNode.getUINode();
  const schema = uiNode.getSchema();
  const visibleCondition = _.get(schema, "state.visible");

  // strategy could and|or
  if (typeof visibleCondition === "object") {
    const { strategy = "and", deps = [] } = visibleCondition;
    // deps condition on UI schema
    deps.forEach((dep: any) => {
      if (dep.selector) {
        const depUINodes = uiNode.searchNodes(dep.selector);
        if (depUINodes.length) {
          // searched the props met the condition
          depUINodes.forEach((depUINode: any) => {
            // match data deps
            if (dep.data !== undefined) {
              const dataNode = depUINode.getDataNode();
              if (dataNode) {
                const data = dataNode.getData();
                if (strategy === "and") {
                  result = result && _.isEqual(data, dep.data);
                  if (!visible) return;
                } else {
                  // or
                  result = result || _.isEqual(data, dep.data);
                  if (result) return;
                }
              }
            }

            // state deps
            if (dep.state && depUINode) {
              const stateNode = depUINode.getStateNode();
              if (stateNode) {
                const stateVisible = stateNode.getState("visible");
                if (stateVisible !== "undefined") {
                  const depVisible = _.get(dep.state, "visible");
                  if (strategy === "and") {
                    result = result && _.isEqual(stateVisible, depVisible);
                    if (!result) return;
                  } else {
                    // or
                    result = result || _.isEqual(stateVisible, depVisible);
                    if (!result) return;
                  }
                } else {
                  // TODO: Need a case to improve this
                  // recursively find other UI Node
                  result = visible(stateNode);
                }
              }
            }
          });
        } else {
          // if no element found
          result = false;
        }
      }
    });
  }

  return result;
}
