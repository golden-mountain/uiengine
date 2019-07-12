import _ from "lodash";
import { searchNodes } from ".";
import { IUINode, IStateNode, IState } from "../../../typings";

// not, is, or,  regexp
function compareRule(expected: any, actual: any, rule: string = "is") {
  const map = {
    not: () => {
      return !_.isEqual(expected, actual);
    },
    is: () => {
      return _.isEqual(expected, actual);
    },
    or: () => {
      return expected || actual;
    },
    empty: () => {
      return _.isEmpty(actual);
    },
    notempty: () => {
      return !_.isEmpty(actual);
    },
    regexp: () => {
      const regexp = new RegExp(expected);
      return regexp.test(actual);
    }
  };
  if (_.isFunction(map[rule])) {
    return map[rule]();
  } else {
    return _.isEqual(expected, actual);
  }
}

export function setComponentState(this: any, state: any) {
  return this.setState(state);
}

export function compareDataLogic(
  expected: any,
  actual: any,
  strategy: string = "and",
  rule: string = "is"
) {
  let result = true;
  let thisResult = true;
  if (_.isObject(actual) && _.isObject(expected)) {
    _.forIn(expected, (value: any, k: string) => {
      thisResult = thisResult && compareRule(actual[k], value, rule);
      if (!thisResult) return;
    });
  } else {
    thisResult = compareRule(expected, actual, rule);
  }

  if (strategy === "and") {
    result = result && thisResult;
  } else {
    result = result || thisResult;
  }
  return result;
}

export function compareStateLogic(
  expected: IState,
  actual: IState,
  strategy = "and",
  rule = "is"
) {
  let result = true;
  if (strategy === "and") {
    result = result && compareRule(expected, actual, rule);
  } else {
    // or
    result = result || compareRule(expected, actual, rule);
  }
  return result;
}

export function stateCompare(
  target: IUINode,
  deps: any,
  name: string,
  strategy: string = "and",
  rule: string = "is"
) {
  let result = true;
  const stateNode = target.getStateNode();
  if (stateNode) {
    const actual = stateNode.getState(name);
    if (actual !== "undefined") {
      const expected = _.get(deps, name);
      result = compareStateLogic(expected, actual, strategy);
    } else {
      // TO FIX: Need a case to improve this
      // recursively find other UI Node
      result = stateDepsResolver(stateNode, name);
    }
  }

  return result;
}

export function dataCompare(
  target: IUINode,
  expected: any,
  strategy: string = "and",
  rule: string = "is"
) {
  let result = true;
  const dataNode = target.getDataNode();
  if (dataNode) {
    result = compareDataLogic(expected, dataNode.getData(), strategy, rule);
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
        const depTargetNodes = searchNodes(dep.selector, uiNode.rootName);
        if (depTargetNodes.length) {
          // searched the props met the condition
          depTargetNodes.forEach((depTargetNode: any) => {
            if (dep.data !== undefined) {
              result =
                result &&
                dataCompare(depTargetNode, dep.data, strategy, dep.comparerule);
            }

            // state deps
            if (dep.state && depTargetNode) {
              result =
                result &&
                stateCompare(
                  depTargetNode,
                  dep.state,
                  stateName,
                  strategy,
                  dep.comparerule
                );
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
