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
    const { layouts = [] } = this.props;
    this.nodeController.messager.setStateFunc(
      this.nodeController.engineId,
      setComponentState.bind(this)
    );
    for (let layout in layouts) {
      this.nodeController.loadUINode(layouts[layout]);
    }
  }

  componentWillUnmount() {
    this.nodeController.messager.removeStateFunc(this.nodeController.engineId);
  }

  render() {
    const { layouts, reqConfig, test, onEngineCreate, ...rest } = this.props;
    return _.entries(this.state.nodes).map((entry: any) => {
      const [layoutKey, uiNodeRenderer] = entry;
      const { uiNode, options } = uiNodeRenderer;
      const containerComponent = _.get(options, "container");
      let Container = ({ children, ...rest }: any) => children;
      if (containerComponent) {
        Container = getComponent(containerComponent);
      }
      const context = {
        controller: this.nodeController,
        uiNode
      };
      return (
        <UIEngineContext.Provider value={context}>
          <Container>
            <ComponentWrapper
              uiNode={uiNode}
              {...rest}
              key={`layout-${layoutKey}`}
            />
          </Container>
        </UIEngineContext.Provider>
      );
    });
  }
}
