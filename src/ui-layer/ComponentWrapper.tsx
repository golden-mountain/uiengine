import React from "react";
import _ from "lodash";

import { PluginManager, getComponent, setComponentState, Cache } from "..";
import { renderNodes } from ".";
import {
  IComponentWrapperProps,
  IComponentWrapperState,
  IWrappedComponentProps,
  IPluginManager,
  IPluginExecuteOption,
  IUINode,
} from "../../typings";

const DefaultWrapper: React.FC = function(props: any) {
  return <>{props.children || null}</>
}

export class ComponentWrapper extends React.Component<
  IComponentWrapperProps,
  IComponentWrapperState
> {
  id: string;
  pluginManager: IPluginManager;

  constructor(props: IComponentWrapperProps) {
    super(props);
    const { uiNode } = props;
    const initialState: IComponentWrapperState = {
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
    // const rootName = _.get(this.props.uiNode, "rootName");
    // const id = _.get(this.props.uiNode, "id");
    // if (id) Cache.clearUINodes(rootName, id);
  }

  render() {
    const { uiNode, config, ...rest } = this.props;

    if (
      !_.get(this.state, "state.visible", true) &&
      !_.get(config, "ideMode", false)
    ) {
      return null;
    }

    if (uiNode.schema) {
      let WrappedComponent: React.ElementType | undefined;

      const componentLine = _.get(uiNode.schema, "component");
      if (_.isString(componentLine)) {
        WrappedComponent = getComponent(componentLine);
      } else if (!_.isNil(componentLine)) {
        WrappedComponent = componentLine
      }
      if (componentLine && !WrappedComponent) {
        console.warn(
          `Component ${componentLine} has no correspond Component registered`
        );
      }

      // map children as components
      let childrenObjects = (uiNode.children || []).map((child: IUINode, index: number) => {
        const childProps = {
          uiNode: child,
          config,
          key: child.id || `${index}`,
        };
        if (_.isObject(child.schema)) {
          const { inheritProps } = child.schema
          if (_.isNil(inheritProps)) {
            _.assign(childProps, rest)
          } else if (_.isBoolean(inheritProps)) {
            if (inheritProps) {
              _.assign(childProps, rest)
            }
          } else if (_.isArray(inheritProps)) {
            const inherited = {}
            inheritProps.forEach((propKey: string) => {
              if (_.isString(propKey) && propKey) {
                inherited[propKey] = rest[propKey]
              }
            })
            _.assign(childProps, inherited)
          }
        }
        return <ComponentWrapper {...childProps} />;
      });

      if (WrappedComponent) {
        try {
          // TO FIX, when add and delete row, the state did not update in time using setState on messager
          // console.log(uiNode.id, this.state, "<<<<<<<< rendering");
          let props: IWrappedComponentProps = {
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
              {renderNodes(uiNode.layoutMap)}
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
