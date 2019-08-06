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
  IUIEngineStates,
  IUINode,
  IUINodeRenderer
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

  // bind to nodeController, to show it own instances
  engineId = _.uniqueId("engine-");

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
      this.engineId,
      setComponentState.bind(this)
    );

    const { layouts = [], loadOptions = {} } = this.props;

    this.nodeController.activeEngine(this.engineId);
    for (let index in layouts) {
      let layout, workingMode;
      if (layouts[index]["layout"]) {
        layout = layouts[index]["layout"];
        workingMode = layouts[index]["workingMode"];
      } else {
        layout = layouts[index];
      }

      // no refresh the state from NodeController,
      // otherwise it will cause deadloop
      this.nodeController.setWorkingMode(layout, workingMode);
      // console.log(layout, workingMode);
      this.nodeController
        .loadUINode(layout, "", loadOptions, false)
        .then((uiNode: IUINode) => {
          const nodes = this.nodeController.nodes;
          this.setState({ nodes });
        });
    }
  }

  componentWillUnmount() {
    this.nodeController.messager.removeStateFunc(this.engineId);
  }

  render() {
    const { layouts, reqConfig, onEngineCreate, ...rest } = this.props;
    const context = {
      controller: this.nodeController
    };

    // only get nodes for this engine
    const validNodes = _.pickBy(
      this.state.nodes,
      (nodeRenderer: IUINodeRenderer) => {
        return nodeRenderer.engineId === this.engineId;
      }
    );

    return (
      <UIEngineContext.Provider value={context}>
        {_.entries(validNodes).map((entry: any, index: number) => {
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
            <Container {...options} visible key={`container-${index}`}>
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
