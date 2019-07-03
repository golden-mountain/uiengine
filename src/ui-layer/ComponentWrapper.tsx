import React from "react";
import _ from "lodash";

import { PluginManager, getComponent } from "..";
import {
  IComponentWrapper,
  IComponentState,
  IPluginManager,
  IPluginExecutionConfig
} from "../../typings";

function setComponentState(this: ComponentWrapper, state: IComponentState) {
  // console.log("node status on Wrapper:", this.props.uiNode.id, state);
  return this.setState(state);
}

class ComponentWrapper extends React.Component<
  IComponentWrapper,
  IComponentState
> {
  pluginManager: IPluginManager = new PluginManager(this);

  constructor(props: IComponentWrapper) {
    super(props);
    const { uiNode } = props;
    const initialState: IComponentState = {
      state: uiNode.stateNode.state,
      data: uiNode.dataNode.data
    };
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
      const WrappedComponent = getComponent(componentLine);

      // map children as components
      let childrenObjects = uiNode.children.map((child: any, key: any) => {
        const props = { ...rest, uiNode: child, key: child.id };
        return <ComponentWrapper {...props} />;
      });

      if (WrappedComponent) {
        try {
          const exeConfig: IPluginExecutionConfig = {
            returnLastValue: true
          };

          let newProps: any = this.pluginManager.executeSyncPlugins(
            "component.props.get",
            exeConfig
          );

          let props = {
            ...rest,
            ...uiNode.props,
            key: `key-of-child-${uiNode.id}`,
            ...newProps,
            uinode: uiNode
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
