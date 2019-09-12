import React from "react";
import _ from "lodash";

import { PluginManager, getComponent, setComponentState, Cache } from "..";
import { renderNodes } from ".";
import {
  IComponentWrapper,
  IComponentState,
  IPluginManager,
  IPluginExecuteOption,
  IComponentWrapperProps
} from "../../typings";

const DefaultWrapper: React.FC = (props: any) => <>{props.children}</>;

class ComponentWrapper extends React.Component<
  IComponentWrapper,
  IComponentState
> {
  id: string;
  pluginManager: IPluginManager;

  constructor(props: IComponentWrapper) {
    super(props);
    const { uiNode } = props;
    const initialState: IComponentState = {
      state: uiNode.stateNode.state,
      data: uiNode.dataNode.data
    };
    this.state = initialState;

    this.id = _.uniqueId("ComponentWrapper-");
    this.pluginManager = PluginManager.getInstance();
    this.pluginManager.register(this.id, {
      categories: ["component.props.get"]
    });
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
    const rootName = _.get(this.props.uiNode, "rootName");
    const id = _.get(this.props.uiNode, "id");
    if (id) Cache.clearUINodes(rootName, id);
  }

  render() {
    const { uiNode, config, ...rest } = this.props;
    if (
      !_.get(this.state, "state.visible", true) &&
      !_.get(config, "ideMode", false)
    ) {
      return null;
    }
    // console.log(_.keys(uiNode.nodes), "will render on component side");
    if (uiNode.schema) {
      // render logic
      const componentLine = _.get(uiNode.schema, "component");
      let WrappedComponent;

      WrappedComponent = getComponent(componentLine);
      if (componentLine && !WrappedComponent) {
        console.warn(
          `Component ${componentLine} has no correspond Component registered`
        );
      }

      // map children as components
      let childrenObjects = uiNode.children.map((child: any, key: any) => {
        const props = { config, ...rest, uiNode: child, key: child.id || key };
        return <ComponentWrapper {...props} />;
      });

      if (WrappedComponent) {
        try {
          // TO FIX, when add and delete row, the state did not update in time using setState on messager
          // console.log(uiNode.id, this.state, "<<<<<<<< rendering");
          let props: IComponentWrapperProps = {
            ...rest,
            ...uiNode.props,
            key: `key-of-child-${uiNode.id}`,
            uinode: uiNode
            // state: this.state
          };

          this.pluginManager.syncExecutePlugins(
            this.id,
            "component.props.get",
            { component: this, props }
          );
          // let newProps: any = _.get(exeResult, `results[0].result`);

          // simple text
          if (uiNode.schema.content) {
            childrenObjects.push(uiNode.schema.content);
          }

          // HOC Wrapper
          let HOCWrapper = DefaultWrapper;

          // only show once error
          if (_.has(config, "widgetConfig.componentWrapper")) {
            HOCWrapper = _.get(
              config,
              "widgetConfig.componentWrapper",
              DefaultWrapper
            );
          }

          return (
            <HOCWrapper {...props}>
              {childrenObjects.length ? (
                <WrappedComponent {...props}>
                  {childrenObjects}
                </WrappedComponent>
              ) : (
                <WrappedComponent {...props} />
              )}
              {renderNodes(uiNode.nodes)}
            </HOCWrapper>
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
