import React from "react";
import _ from "lodash";
import { UIEngineRegister, Cache, parseRootName } from "../";
import { IUINode, ILayoutSchema } from "../../../typings";

/**
 * From schema define, get registered components
 * @param componentLine like antd:Component
 */
export function getComponent(componentLine?: string) {
  let WrappedComponent: any;
  if (!componentLine) {
    WrappedComponent = (props: any) => props.children;
  } else {
    // get registered component
    const componentMap = UIEngineRegister.componentsLibrary;
    let [packageName, component] = componentLine.split(":");
    const defaultComponent = (props: any) => {
      const { children, uinode, ...rest } = props;
      return React.createElement(packageName, rest, children);
    };

    // the lineage like 'div', 'a'
    if (!component) {
      WrappedComponent = defaultComponent;
    } else {
      if (component.indexOf(".") > -1) {
        const [com, sub] = component.split(".");
        WrappedComponent = _.get(componentMap, `${packageName}.${com}`);
        if (WrappedComponent) {
          WrappedComponent = _.get(WrappedComponent, sub);
        } else {
          WrappedComponent = defaultComponent;
        }
      } else {
        WrappedComponent = _.get(componentMap, `${packageName}.${component}`);
      }
    }
  }
  return WrappedComponent;
}

/**
 * Search UINodes which has the search condition props
 *
 * @param prop the schema defined props
 * @param rootName the root name of the loaded schema nodes
 * @return UINodes has the props
 */
export function searchNodes(prop: object, rootName: string = "") {
  let nodes: Array<any> = [];
  // const rootName = parseRootName(layout);

  let allUINodes = {};
  if (rootName) {
    allUINodes = Cache.getUINode(rootName);
  } else {
    // if rootName not provided, merge all nodes, and search from
    const nodes = Cache.getCache("uiNodes");
    _.forIn(nodes, (node: any) => {
      allUINodes = _.assign(allUINodes, node);
    });
  }

  if (_.isObject(allUINodes)) {
    _.forIn(allUINodes, (target: any, id: string) => {
      if (!target.getSchema) return;
      let finded = true;
      const schema = target.getSchema();
      _.forIn(prop, (v: any, name: string) => {
        // handle name with $
        if (name.indexOf("$") > -1 && schema._index !== undefined) {
          name = name.replace("$", schema._index);
        }
        const schemaValue = _.get(schema, name);
        if (v !== schemaValue) {
          finded = false;
          return;
        }
      });
      if (finded) {
        nodes.push(target);
      }
    });
  }
  return nodes;
}

/**
 * Search the node who deps on me
 * A => Dep => B(myNode)
 *
 * @param myNode depend on node
 * @returns UINodes which depends on my result
 */
export function searchDepsNodes(myNode: IUINode) {
  let schema: ILayoutSchema = myNode.getSchema();
  let root = myNode.rootName;

  let nodes: Array<any> = [];
  // to fix: rootName should not be empty
  let allUINodes = Cache.getUINode(root) as IUINode;
  _.forIn(allUINodes, (node: IUINode) => {
    if (!node.schema) return;
    const sch = node.getSchema();
    if (sch.state) {
      _.forIn(sch.state, (state: any, key: string) => {
        if (state.deps) {
          _.forEach(state.deps, (dep: any) => {
            if (dep.selector) {
              let finded = false;
              //k=id, v:id-of-demo-element-1
              _.forIn(dep.selector, (v: any, k: any) => {
                const depValue = _.get(schema, k);
                if (v !== depValue) {
                  finded = false;
                  return;
                } else {
                  finded = true;
                }
              });

              if (finded) {
                nodes.push(node);
              }
            }
          });
        }
      });
    }
  });
  return nodes;
}
