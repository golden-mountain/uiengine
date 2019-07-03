import React from "react";
import _ from "lodash";
import { UIEngineRegister } from "./";

export function getComponent(componentLine?: string) {
  let WrappedComponent: any;
  if (!componentLine) {
    WrappedComponent = (props: any) => props.children;
  } else {
    // get registered component
    const componentMap = UIEngineRegister.componentsLibrary;
    let [packageName, component] = componentLine.split(":");
    const defaultComponent = (props: any) => {
      const { children, ...rest } = props;
      return React.createElement(packageName, rest, children);
    };
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
