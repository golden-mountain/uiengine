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
  }

  componentDidMount() {
    const { layouts = [], test } = this.props;
    let nodes: any = this.state.nodes;

    for (let layout in layouts) {
      this.nodes[layout] = this.nodeController
        .loadUINode(layouts[layout])
        .then((uiNode: IUINode) => {
          this.nodeController.messager.setStateFunc(
            `layout-${layout}`,
            this.setState
          );
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
      const layoutName = `layout-${layout}`;
      this.nodeController.messager.removeStateFunc(layoutName);
    });
  }

  render() {
    const { layouts, reqConfig, test, ...rest } = this.props;
    const context = {
      controller: this.nodeController
    };
    return (
      <UIEngineContext.Provider value={context}>
        {this.state.nodes.map((uiNode: IUINode, layoutKey: number) => {
          return (
            <ComponentWrapper
              uiNode={uiNode}
              {...rest}
              key={`layout-${layoutKey}`}
            />
          );
        })}
      </UIEngineContext.Provider>
    );
  }
}
