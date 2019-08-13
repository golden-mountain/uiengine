import _ from "lodash";

import {
  IUINode,
  IMessager,
  INodeController,
  INodeProps,
  ILayoutSchema,
  IRequestConfig,
  IErrorInfo,
  IWorkflow,
  IUINodeRenderer,
  IRequest,
  ILoadOptions,
  IPluginManager,
  IWorkingMode
} from "../../typings";
import { UINode } from "../data-layer";
import {
  Messager,
  Request,
  Workflow,
  PluginManager,
  DataPool
} from "../helpers";
import { searchNodes } from "../helpers";

export default class NodeController implements INodeController {
  static instance: INodeController;
  static getInstance = () => {
    if (!NodeController.instance) {
      NodeController.instance = new NodeController();
    }
    return NodeController.instance as NodeController;
  };
  pluginManager: IPluginManager = new PluginManager(this);
  // layout path
  errorInfo: IErrorInfo = {};
  // layouts: object = {};
  nodes: {
    [name: string]: IUINodeRenderer;
  } = {};
  messager: IMessager = Messager.getInstance();
  requestConfig: IRequestConfig = {};
  activeLayout: string = "";
  layouts: Array<string> = [];
  workflow: IWorkflow;
  engineId: string = _.uniqueId("engine-");
  request: IRequest = Request.getInstance();

  constructor() {
    this.workflow = Workflow.getInstance();
    this.workflow.setNodeController(this);
  }

  activeEngine(engineId: string) {
    this.engineId = engineId;
  }

  setRequestConfig(requestConfig: IRequestConfig) {
    this.requestConfig = requestConfig;
    this.request.setConfig(this.requestConfig);
  }

  /**
   * Load a layout from remote or local
   * @param layout ILayoutSchema|string path of layout or loaded layout
   */
  async loadUINode(
    layout: ILayoutSchema | string,
    id?: string,
    options?: ILoadOptions,
    updateNodes: boolean = true
  ) {
    // get a unique id
    let rootName = "default";
    if (id) {
      rootName = id;
    } else {
      if (_.isObject(layout)) {
        rootName = _.get(layout, "id", "default");
      } else {
        rootName = layout;
      }
    }

    // use cached nodes
    let uiNode: IUINode = _.get(this.nodes[rootName], "uiNode");
    const workingMode = this.getWorkingMode(rootName);
    if (!uiNode) {
      // default we load all default plugins
      uiNode = new UINode({}, this.request, rootName);
      try {
        await uiNode.loadLayout(layout, workingMode);
      } catch (e) {
        console.error(e.message);
      }
    } else {
      await uiNode.updateLayout(workingMode);
    }

    const rendererOptions = _.merge(this.nodes[rootName], {
      uiNode,
      visible: true,
      options,
      engineId: this.engineId
    });
    this.nodes[rootName] = rendererOptions;

    // add layout stack
    this.pushLayout(rootName);
    this.activeLayout = rootName;

    // update parent node
    const parentNode = _.get(options, "parentNode");
    if (parentNode) {
      const nodesOfParentNode = _.get(parentNode.nodes, `${rootName}.uiNode`);
      if (nodesOfParentNode !== uiNode) {
        parentNode.nodes[rootName] = rendererOptions;
      }
    }

    // send message
    if (updateNodes) {
      if (parentNode) {
        parentNode.sendMessage(true);
      } else {
        this.messager.sendMessage(this.engineId, {
          nodes: this.nodes
        });
      }
    }
    return uiNode;
  }

  deleteUINode(layout: string): boolean {
    _.unset(this.nodes, layout);

    // send message to caller
    this.messager.sendMessage(this.engineId, this.nodes);
    _.remove(this.layouts, (l: string) => {
      return l === layout;
    });

    // activelayout
    this.activeLayout = _.last(this.layouts) || "";
    return true;
  }

  hideUINode(layout: string, clearSource: boolean = false) {
    const renderer = this.nodes[layout];
    if (renderer) {
      renderer.visible = false;
    }

    // set active layout as last node
    const index = _.findLastIndex(this.layouts, function(o) {
      return o !== layout;
    });
    if (index > -1) {
      this.activeLayout = this.layouts[index];
    } else {
      this.activeLayout = "";
    }

    // clear data pool
    const workingMode = this.getWorkingMode(layout);
    if (clearSource && _.has(workingMode, "options.source.source")) {
      const dataPool = DataPool.getInstance();
      const source = _.get(workingMode, "options.source.source");
      if (source) dataPool.clear(source);
    }

    const parentNode = _.get(renderer, "options.parentNode");
    if (parentNode) {
      // must force update , since the data adjugement on uinode side not precised
      parentNode.sendMessage(true);
    } else {
      this.messager.sendMessage(this.engineId, {
        nodes: this.nodes
      });
    }
  }

  getUINode(layout: string, uiNodeOnly: boolean = false) {
    const uiNode = _.get(this.nodes, layout);
    if (uiNodeOnly) {
      return uiNode.uiNode;
    }
    return uiNode;
  }

  castMessage(nodeSelector: INodeProps, data: any, ids?: [string]) {
    let nodes: any = this.nodes;
    if (ids) {
      nodes = _.pick(this.nodes, ids);
    }
    _.forIn(nodes, (uiNode: IUINodeRenderer) => {
      let searchedNodes = searchNodes(nodeSelector, uiNode.uiNode.rootName);
      _.forEach(searchedNodes, (s: IUINode) => {
        s.messager.sendMessage(s.id, data);
      });
    });
  }

  pushLayout(layout: string) {
    _.remove(this.layouts, (l: string) => {
      return l === layout;
    });

    this.layouts.push(layout);
  }

  setWorkingMode(layout: string, workingMode: IWorkingMode) {
    if (_.isEmpty(this.nodes[layout])) {
      this.nodes[layout] = {} as IUINodeRenderer;
    }

    if (workingMode) {
      _.set(this.nodes[layout], "workingMode", workingMode);
    }
  }

  getWorkingMode(layout?: string) {
    if (!layout) layout = this.activeLayout;
    return _.get(this.nodes[layout], "workingMode");
  }
}
