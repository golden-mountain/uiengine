import React from "react";
import _ from "lodash";
import {
  NodeController,
  ComponentWrapper,
  UIEngineRegister,
  UIEngineContext,
  setComponentState,
  getComponent
} from "..";

import * as plugins from "../plugins";
UIEngineRegister.registerPlugins(plugins);

import {
  INodeController,
  IUIEngineProps,
  IUIEngineStates
} from "../../typings";

export default class UIEngine extends React.Component<
  IUIEngineProps,
  IUIEngineStates
> {
  state = {
    nodes: [],
    activeNodeID: ""
  };
  nodeController: INodeController;

  constructor(props: IUIEngineProps) {
    super(props);
    this.nodeController = NodeController.getInstance();
    this.nodeController.setRequestConfig(props.reqConfig);
    if (_.isFunction(props.onEngineCreate)) {
      props.onEngineCreate(this.nodeController);
    }
  }

  componentDidMount() {
    this.nodeController.messager.setStateFunc(
      this.nodeController.engineId,
      setComponentState.bind(this)
    );

    const { layouts = [] } = this.props;
    for (let layout in layouts) {
      this.nodeController.loadUINode(layouts[layout]);
    }
  }

  componentWillUnmount() {
    this.nodeController.messager.removeStateFunc(this.nodeController.engineId);
  }

  render() {
    const { layouts, reqConfig, onEngineCreate, ...rest } = this.props;
    const context = {
      controller: this.nodeController
    };
    return (
      <UIEngineContext.Provider value={context}>
        {_.entries(this.state.nodes).map((entry: any) => {
          const [layoutKey, uiNodeRenderer] = entry;
          const { uiNode, options = {}, visible = true } = uiNodeRenderer;
          const { container } = options;

          if (!visible) return null;

          // wrapper if provided
          let Container = ({ children }: any) => children;
          if (container) {
            Container = getComponent(container);
          }

          return (
            <Container {...options} visible>
              <ComponentWrapper
                uiNode={uiNode}
                {...rest}
                key={`layout-${layoutKey}`}
              />
            </Container>
          );
        })}
      </UIEngineContext.Provider>
    );
  }
}
