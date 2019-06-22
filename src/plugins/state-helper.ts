import _ from "lodash";
import { IStateNode } from "../../typings/StateNode";

export function stateDepsResolver(stateNode: IStateNode, stateName: string) {
  let result = true;
  const uiNode = stateNode.getUINode();
  const schema = uiNode.getSchema();
  const basicCondition = _.get(schema, `state.${stateName}`);

  // strategy could and|or
  if (typeof basicCondition === "object") {
    const { strategy = "and", deps = [] } = basicCondition;
    // deps condition on UI schema
    deps.forEach((dep: any) => {
      if (dep.selector) {
        const depUINodes = uiNode.searchNodes(dep.selector);
        if (depUINodes.length) {
          // searched the props met the condition
          depUINodes.forEach((depUINode: any) => {
            console.log(">>>>>", depUINode.getDataNode().getData());
            // match data deps
            if (dep.data !== undefined) {
              const dataNode = depUINode.getDataNode();

              if (dataNode) {
                const data = dataNode.getData();
                console.log(data, dep.data, "<<<<< depUI");

                if (strategy === "and") {
                  result = result && _.isEqual(data, dep.data);
                  if (!result) return;
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
                const stateBasic = stateNode.getState(stateName);
                if (stateBasic !== "undefined") {
                  const depBasic = _.get(dep.state, stateName);
                  if (strategy === "and") {
                    result = result && _.isEqual(stateBasic, depBasic);
                    if (!result) return;
                  } else {
                    // or
                    result = result || _.isEqual(stateBasic, depBasic);
                    if (!result) return;
                  }
                } else {
                  // TO FIX: Need a case to improve this
                  // recursively find other UI Node
                  result = stateDepsResolver(stateNode, stateName);
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
