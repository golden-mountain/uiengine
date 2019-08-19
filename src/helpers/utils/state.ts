import _ from "lodash";
import { searchNodes } from ".";
import { IUINode, IStateNode, IDependanceTree, IDependanceNode } from "../../../typings";

export function setComponentState(this: any, state: any) {
  return this.setState(state);
}

/**
 * compare the actual value with the expected value
 * @param actual
 * @param expected
 * @param rule
 * is
 * not
 * above
 * below
 * include
 * exclude
 * matchOne
 * matchAll
 * dismatchOne
 * dismatchAll
 * empty
 * notEmpty
 * or
 * regexp
 */
const compareRules = {
  is: (actual: any, expected: any) => {
    return _.isEqual(actual, expected)
  },
  not: (actual: any, expected: any) => {
    return !_.isEqual(actual, expected)
  },
  above: (actual: any, expected: any) => {
    return actual > expected
  },
  below: (actual: any, expected: any) => {
    return actual < expected
  },
  include: (actual: any, expected: any) => {
    if (_.hasIn(actual, expected)) {
      return !_.isNil(_.get(actual, expected))
    }
    return false
  },
  exclude: (actual: any, expected: any) => {
    if (_.hasIn(actual, expected)) {
      return _.isNil(_.get(actual, expected))
    }
    return true
  },
  matchOne: (actual: any, expected: any) => {
    if (_.isObject(expected) && !_.isEmpty(expected)) {
      let result = false
      _.forIn(expected, (value, key) => {
        const actualValue = _.get(actual, key)
        if (_.isEqual(actualValue, value)) {
          result = true
        }
      })
      return result
    }
    return false
  },
  matchAll: (actual: any, expected: any) => {
    if (_.isObject(expected)) {
      let result = true
      _.forIn(expected, (value, key) => {
        const actualValue = _.get(actual, key)
        if (!_.isEqual(actualValue, value)) {
          result = false
        }
      })
      return result
    }
    return false
  },
  dismatchOne: (actual: any, expected: any) => {
    if (_.isObject(expected) && !_.isEmpty(expected)) {
      let result = false
      _.forIn(expected, (value, key) => {
        const actualValue = _.get(actual, key)
        if (!_.isEqual(actualValue, value)) {
          result = true
        }
      })
      return result
    }
    return false
  },
  dismatchAll: (actual: any, expected: any) => {
    if (_.isObject(expected)) {
      let result = true
      _.forIn(expected, (value, key) => {
        const actualValue = _.get(actual, key)
        if (_.isEqual(actualValue, value)) {
          result = false
        }
      })
      return result
    }
    return false
  },
  empty: (actual: any, expected: any) => {
    return _.isEmpty(actual)
  },
  notEmpty: (actual: any, expected: any) => {
    return !_.isEmpty(actual)
  },
  or: (actual: any, expected: any) => {
    return actual || expected
  },
  regexp: (actual: any, expected: any) => {
    const regexp = new RegExp(expected)
    return regexp.test(actual)
  }
}
function compare(actual: any, expected: any, rule: string = "is") {
  const compareLogic = compareRules[rule]
  if (_.isFunction(compareLogic)) {
    return compareLogic(actual, expected)
  } else {
    return _.isEqual(actual, expected)
  }
}

export function dataCompare(
  target: IUINode,
  expectedData: any,
  compareRule: string = "is",
  defaultResult?: boolean,
) {
  const { dataNode } = target
  if (dataNode) {
    const actual = dataNode.getData()
    const expected = expectedData
    return compare(actual, expected, compareRule)
  }
  // When can not find target dataNode, return the default value or false
  return defaultResult || false
}

export function stateCompare(
  target: IUINode,
  expectedState: { [key: string]: any },
  compareRule:string = 'is',
  compareStrategy: string = 'and',
  defaultResult?: boolean,
) {
  const { stateNode } = target
  if (stateNode) {
    if (compareStrategy === 'and') {
      return Object.keys(expectedState).every((stateName: string) => {
        const actual = stateNode.getState(stateName)
        const expected = expectedState[stateName]
        return compare(actual, expected, compareRule)
      })
    } else if (compareStrategy === 'or') {
      return Object.keys(expectedState).some((stateName: string) => {
        const actual = stateNode.getState(stateName)
        const expected = expectedState[stateName]
        return compare(actual, expected, compareRule)
      })
    }
  }
  // When can not find target stateNode or strategy logic, return the default value or false
  return defaultResult || false
}

export function stateDepsResolver(
  stateNode: IStateNode,
  stateName: string,
  defaultState?: boolean,
): boolean {
  const uiNode = stateNode.getUINode()
  const schema = uiNode.getSchema()
  const stateDepConfig = _.get(schema, `state.${stateName}`)

  if (_.isObject(stateDepConfig) as any) {
    return resolveDependance(uiNode, stateName, stateDepConfig)
  } else {
    // When can not find stateDepConfig, return the default value or false
    return defaultState || false
  }
}

function resolveDependance(
  uiNode: IUINode,
  stateName: string,
  condition: IDependanceTree & IDependanceNode,
): boolean {
  const {
    // dependance tree
    deps,
    strategy = 'and',
    // dependance node
    selector,
    data,
    dataCompareRule = 'is',
    state,
    stateCompareRule = 'is',
    stateCompareStrategy = 'and',
  } = condition
  if (_.isArray(deps) && deps.length > 0) {
    if (strategy === 'and') {
      return deps.every((dep: any) => {
        return resolveDependance(uiNode, stateName, dep)
      })
    } else if (strategy === 'or') {
      return deps.some((dep: any) => {
        return resolveDependance(uiNode, stateName, dep)
      })
    }
  } else if (_.isObject(selector) && !_.isEmpty(selector)) {
    const depUINodes = searchNodes(selector, uiNode.rootName);

    if (_.isArray(depUINodes) && depUINodes.length > 0) {
      return depUINodes.every((targetUINode: any) => {
        let dataMatched = true
        if (data !== undefined) {
          dataMatched = dataCompare(targetUINode, data, dataCompareRule)
        }
        let stateMatched = true
        if (_.isObject(state)) {
          stateMatched = stateCompare(targetUINode, state, stateCompareRule, stateCompareStrategy)
        }
        return dataMatched && stateMatched
      })
    } else {
      return false
    }
  }
  return true
}
