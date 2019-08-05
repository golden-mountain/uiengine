import React from "react";
import _ from "lodash";

import { PluginManager, getComponent, setComponentState } from "..";
import {
  IComponentWrapper,
  IComponentState,
  IPluginManager,
  IPluginExecutionConfig
} from "../../typings";

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
  }

  componentDidMount() {
    // register setState func
    this.props.uiNode.messager.setStateFunc(
      this.props.uiNode.id,
      setComponentState.bind(this)
    );
  }

  componentWillUnmount() {
    this.props.uiNode.messager.removeStateFunc(this.props.uiNode.id);
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
        const props = { ...rest, uiNode: child, key: child.id || key };
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
            uinode: uiNode,
            state: this.state
          };

          // simple text
          if (uiNode.schema.content) {
            childrenObjects.push(uiNode.schema.content);
          }

          return childrenObjects.length ? (
            <WrappedComponent {...props}>{childrenObjects}</WrappedComponent>
          ) : (
            <WrappedComponent {...props} />
          );
        } catch (e) {
          console.error(e.message);
        }
      } else {
        console.error("load component error: ", componentLine);
      }
    }

    return null;
  }
}

export default ComponentWrapper;
