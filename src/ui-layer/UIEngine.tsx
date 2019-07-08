import React from "react";
import _ from "lodash";
import {
  NodeController,
  ComponentWrapper,
  UIEngineRegister,
  UIEngineContext
} from "..";

import * as plugins from "../plugins";
UIEngineRegister.registerPlugins(plugins);

import {
  IUINode,
  INodeController,
  IUIEngineProps,
  IUIEngineStates
} from "../../typings";

export default class UIEngine extends React.Component<
  IUIEngineProps,
  IUIEngineStates
> {
  nodes: any = [];
  state = {
    nodes: [],
    activeNodeID: ""
  };
  nodeController: INodeController;

  constructor(props: IUIEngineProps) {
    super(props);
    this.nodeController = new NodeController(props.reqConfig);
    if (_.isFunction(props.onEngineCreate)) {
      props.onEngineCreate(this.nodeController);
    }
  }

  componentDidMount() {
    const { layouts = [], test } = this.props;
    let nodes: any = this.state.nodes;

    for (let layout in layouts) {
      this.nodes[layout] = this.nodeController
        .loadUINode(layouts[layout])
        .then((uiNode: IUINode) => {
          this.nodeController.messager.setStateFunc(layout, this.setState);
          nodes[layout] = uiNode;
          this.setState({ nodes });
          return uiNode;
        });
    }
    // for test purpose
    if (test) {
      test(Promise.all(this.nodes));
    }
  }

  componentWillUnmount() {
    this.props.layouts.forEach((uiNode: any, layout: any) => {
      const layoutName = layout;
      this.nodeController.messager.removeStateFunc(layoutName);
    });
  }

  render() {
    const { layouts, reqConfig, test, onEngineCreate, ...rest } = this.props;

    return this.state.nodes.map((uiNode: IUINode, layoutKey: number) => {
      const context = {
        controller: this.nodeController,
        uiNode
      };
      return (
        <UIEngineContext.Provider value={context}>
          <ComponentWrapper
            uiNode={uiNode}
            {...rest}
            key={`layout-${layoutKey}`}
          />
        </UIEngineContext.Provider>
      );
    });
  }
}
