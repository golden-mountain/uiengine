import React from "react";
import _ from "lodash";

import { UIEngineRegister } from "..";
import { IComponentWrapper, IComponentState } from "../../typings";

function setComponentState(this: ComponentWrapper, state: IComponentState) {
  // console.log("node status on Wrapper:", this.props.uiNode.id, state);
  return this.setState(state);
}

class ComponentWrapper extends React.Component<
  IComponentWrapper,
  IComponentState
> {
  constructor(props: IComponentWrapper) {
    super(props);
    const { uiNode } = props;
    const visible = uiNode.stateNode.getState("visible");
    const data = uiNode.dataNode.getData();
    const initialState: IComponentState = { state: { visible }, data };
    this.state = initialState;

    // register setState func
    uiNode.messager.setStateFunc(uiNode.id, setComponentState.bind(this));
  }

  componentWillUnmount() {
    this.props.uiNode.messager.removeStateFunc(this.props.uiNode.id);
  }

  componentWillUpdate() {
    // console.log("state received on Wrapper:", this.props.uiNode.id, this.state);
  }

  render() {
    const { uiNode, ...rest } = this.props;

    if (!_.get(this.state, "state.visible", true)) {
      return null;
    }

    if (uiNode.schema) {
      // render logic
      const componentLine = _.get(uiNode.schema, "component");
      if (!componentLine) {
        return null;
      }

      // get registered component
      const componentMap = UIEngineRegister.componentsLibrary;
      const [packageName, component] = componentLine.split(":");
      const WrappedComponent: any = componentMap[packageName]
        ? componentMap[packageName][component]
        : componentMap[component];

      // map children as components
      let childrenObjects = uiNode.children.map((child: any, key: any) => {
        if (_.isArray(child)) {
          return child.map((c: any, id: any) => {
            const props = { ...rest, uiNode: c, key: c.id };
            return <ComponentWrapper {...props} />;
          });
        }
        const props = { ...rest, uiNode: child, key: child.id };
        return <ComponentWrapper {...props} />;
      });

      if (WrappedComponent) {
        try {
          const props = {
            ...rest,
            ...uiNode.props,
            key: `key-of-child-${uiNode.id}`
          };
          return uiNode.children.length ? (
            <WrappedComponent {...props}>{childrenObjects}</WrappedComponent>
          ) : (
            <WrappedComponent {...props} />
          );
        } catch (e) {
          console.log(e);
        }
      } else {
        console.error(
          "ComponentWrapper not loading component for schema",
          uiNode.schema
        );
      }
    }

    return null;
  }
}

export default ComponentWrapper;
