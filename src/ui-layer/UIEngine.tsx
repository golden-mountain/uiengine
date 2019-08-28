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

const DefaultMessager: React.FC = (props: any) => <div />;
const DefaultUIEngineWrapper: React.FC = (props: any) => <>{props.children}</>;

export default class UIEngine extends React.Component<
  IUIEngineProps,
  IUIEngineStates
> {
  state = {
    nodes: [],
    error: {},
    time: 0,
    activeNodeID: ""
  };
  nodeController: INodeController;
  error = {};

  // bind to nodeController, to show it own instances
  engineId = _.uniqueId("engine-");

  constructor(props: IUIEngineProps) {
    super(props);
    if (!props.config) {
      console.warn("No requestConfig on props, this is required!");
    }

    this.nodeController = NodeController.getInstance();
    const { requestConfig } = props.config;
    this.nodeController.setRequestConfig(requestConfig);

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
        layout = _.isObject(layouts[index]) ? "default" : layouts[index];
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
    const { layouts, config, ideMode, onEngineCreate, ...rest } = this.props;
    const context = {
      controller: this.nodeController
    };

    // error handler
    const { error, time } = this.state;
    let Messager = DefaultMessager;
    // only show once error
    if (_.has(error, "code") && !_.isEqual(error, this.error)) {
      if (_.has(config, "widgetConfig.messager")) {
        Messager = _.get(config, "widgetConfig.messager", DefaultMessager);
      } else {
        Messager = (props: any) => {
          return (
            <div className={`uiengine-message message-${props.status}`}>
              {props.code}
            </div>
          );
        };
      }
      this.error = error;
    }

    // UIEngine Wrapper
    let UIEngineWrapper = DefaultUIEngineWrapper;
    if (_.has(config, "widgetConfig.uiengineWrapper")) {
      UIEngineWrapper = _.get(
        config,
        "widgetConfig.uiengineWrapper",
        DefaultUIEngineWrapper
      );
    }

    // only get nodes for this engine
    const validNodes = _.pickBy(
      this.state.nodes,
      (nodeRenderer: IUINodeRenderer) => {
        const { engineId, options } = nodeRenderer;
        if (options) {
          return engineId === this.engineId && !_.has(options, "parentNode");
        }
        return engineId === this.engineId;
      }
    );

    return (
      <UIEngineContext.Provider value={context}>
        <UIEngineWrapper {...this.props}>
          <Messager {...error} />
          {renderNodes(validNodes, { config, ...rest })}
        </UIEngineWrapper>
      </UIEngineContext.Provider>
    );
  }
}

export function renderNodes(uiNodeRenderers: any, restOptions?: any) {
  return _.entries(uiNodeRenderers).map((entry: any, index: number) => {
    const [layoutKey, uiNodeRenderer] = entry;
    const { uiNode, options = {}, visible } = uiNodeRenderer;
    const { container } = options;

    if (!visible) return null;

    // wrapper if provided
    let Container = ({ children }: any) => children;
    if (container) {
      Container = getComponent(container);
    }

    return (
      <Container {...options} visible={visible} key={`container-${index}`}>
        <ComponentWrapper
          uiNode={uiNode}
          {...restOptions}
          key={`layout-${layoutKey}`}
        />
      </Container>
    );
  });
}
