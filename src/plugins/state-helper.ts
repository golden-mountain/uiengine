import _ from "lodash";
import { IStateNode } from "../../typings/StateNode";

export function stateDepsResolver(stateNode: IStateNode, stateName: string) {
  let result = true;
  const uiNode = stateNode.getUINode();
  const schema = uiNode.getSchema();
  const basicCondition = _.get(schema, `state.${stateName}`);

  // console.log("........ visible plugin ..........", schema, stateName);
  // strategy could and|or
  if (typeof basicCondition === "object") {
    const { strategy = "and", deps = [] } = basicCondition;
    // deps condition on UI schema
    deps.forEach((dep: any) => {
      // console.log(dep, "dep.....");
      if (dep.selector) {
        const depTargetNodes = uiNode.searchNodes(dep.selector);
        // console.log("depUINodes:", depUINodes);
        if (depTargetNodes.length) {
          // searched the props met the condition
          depTargetNodes.forEach((depTargetNode: any) => {
            // match data deps
            if (dep.data !== undefined) {
              const dataNode = depTargetNode.getDataNode();
              if (dataNode) {
                const data = dataNode.getData();
                // console.log(depTargetNode.schema, "<<<<< depUI");
                // for handling dep data like { name: 'Zp', other: 'false'}
                let thisResult = true;
                if (_.isObject(dep.data) && _.isObject(data)) {
                  _.forIn(dep.data, (value: any, k: string) => {
                    thisResult = thisResult && _.isEqual(value, data[k]);
                    if (!thisResult) return;
                  });
                } else {
                  thisResult = _.isEqual(data, dep.data);
                }

                if (strategy === "and") {
                  result = result && thisResult;
                  // console.log("state-helper:", result, dep.data, data);
                  if (!result) return;
                } else {
                  // or
                  result = result || thisResult;
                  if (result) return;
                }
              }
            }

            // state deps
            if (dep.state && depTargetNode) {
              const stateNode = depTargetNode.getStateNode();
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
