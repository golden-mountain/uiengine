import React from "react";
import _ from "lodash";

import { PluginManager, getComponent, setComponentState, Cache } from "..";
import { renderNodes } from ".";
import {
  IComponentWrapper,
  IComponentState,
  IPluginManager,
  IPluginExecutionConfig,
  IComponentWrapperProps
} from "../../typings";

const DefaultWrapper: React.FC = (props: any) => <>{props.children}</>;

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
      console.log(_.get(config, "ideMode", false), " is ide mode");
      return null;
    }
    // console.log(_.keys(uiNode.nodes), "will render on component side");
    if (uiNode.schema) {
      // render logic
      const componentLine = _.get(uiNode.schema, "component");
      if (!componentLine) {
        console.error(
          'schema did not provide critical keyword "component"',
          _.cloneDeep(uiNode.schema)
        );
        return null;
      }
      const WrappedComponent = getComponent(componentLine);
      if (!WrappedComponent) {
        console.error(
          `Component ${componentLine} has no correspond Component registered`
        );
        return null;
      }
      // map children as components
      let childrenObjects = uiNode.children.map((child: any, key: any) => {
        const props = { config, ...rest, uiNode: child, key: child.id || key };
        return <ComponentWrapper {...props} />;
      });

      if (WrappedComponent) {
        try {
          const exeConfig: IPluginExecutionConfig = {
            returnLastValue: true
          };

          // TO FIX, when add and delete row, the state did not update in time using setState on messager
          // console.log(uiNode.id, this.state, "<<<<<<<< rendering");
          let newProps: any = this.pluginManager.executeSyncPlugins(
            "component.props.get",
            exeConfig
          );

          let props: IComponentWrapperProps = {
            ...rest,
            ...uiNode.props,
            key: `key-of-child-${uiNode.id}`,
            ...newProps,
            uinode: uiNode
            // state: this.state
          };

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
