import _ from "lodash";
import { IUINode, IStateNode, IState } from "../../typings";

function compareDataLogic(data1: any, data2: any, strategy: string = "and") {
  let result = true;
  let thisResult = true;
  if (_.isObject(data2) && _.isObject(data1)) {
    _.forIn(data2, (value: any, k: string) => {
      thisResult = thisResult && _.isEqual(value, data1[k]);
      if (!thisResult) return;
    });
  } else {
    thisResult = _.isEqual(data1, data2);
  }

  if (strategy === "and") {
    result = result && thisResult;
  } else {
    result = result || thisResult;
  }
  return result;
}

function compareStateLogic(state1: IState, state2: IState, strategy = "and") {
  let result = true;
  if (strategy === "and") {
    result = result && _.isEqual(state1, state2);
  } else {
    // or
    result = result || _.isEqual(state1, state2);
  }
  return result;
}

function stateCompare(
  target: IUINode,
  deps: any,
  name: string,
  strategy: string = "and"
) {
  let result = true;
  const stateNode = target.getStateNode();
  if (stateNode) {
    const stateBasic = stateNode.getState(name);
    if (stateBasic !== "undefined") {
      const depBasic = _.get(deps, name);
      result = compareStateLogic(depBasic, stateBasic, strategy);
    } else {
      // TO FIX: Need a case to improve this
      // recursively find other UI Node
      result = stateDepsResolver(stateNode, name);
    }
  }

  return result;
}

function dataCompare(target: IUINode, deps: any, strategy: string = "and") {
  let result = true;
  const dataNode = target.getDataNode();
  if (dataNode) {
    result = compareDataLogic(dataNode.getData(), deps, strategy);
  }
  return result;
}

export function stateDepsResolver(stateNode: IStateNode, stateName: string) {
  let result = true;
  const uiNode = stateNode.getUINode();
  const schema = uiNode.getSchema();
  const basicCondition = _.get(schema, `state.${stateName}`);

  if (typeof basicCondition === "object") {
    const { strategy = "and", deps = [] } = basicCondition;
    deps.forEach((dep: any) => {
      if (dep.selector) {
        // depends on which node?
        const depTargetNodes = uiNode.searchNodes(dep.selector);
        if (depTargetNodes.length) {
          // searched the props met the condition
          depTargetNodes.forEach((depTargetNode: any) => {
            if (dep.data !== undefined) {
              result = result && dataCompare(depTargetNode, dep.data, strategy);
            }

            // state deps
            if (dep.state && depTargetNode) {
              result =
                result &&
                stateCompare(depTargetNode, dep.state, stateName, strategy);
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
