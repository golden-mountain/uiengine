import _ from "lodash";

import { UINode, NodeController } from "../data-layer";
import { DataPool } from "./DataPool";
import { PluginManager } from "./PluginManager";
import { searchNodes } from "./utils/ui"
import { submitToAPI } from "./utils/data"

import {
  IAddLayoutConfig,
  IConnectOptions,
  IDataSource,
  ILoadOptions,
  INodeController,
  INodeProps,
  IPluginExecuteOption,
  IPluginManager,
  IWorkflow,
  IWorkingMode,
  IUINode,
} from "../../typings";

export class Workflow implements IWorkflow {
  private static instance: Workflow;
  static getInstance = () => {
    if (_.isNil(Workflow.instance)) {
      Workflow.instance = new Workflow();
    }
    return Workflow.instance;
  };

  readonly id: string = _.uniqueId('Workflow-')
  controller?: INodeController
  pluginManager: IPluginManager = PluginManager.getInstance();

  activeNode?: IUINode;

  constructor() {
    this.pluginManager.register(
      this.id,
      { categories: [] }
    )
  }

  setController(controller: INodeController) {
    this.controller = controller
  }

  addLayout(
    engineId: string,
    layoutKey: string,
    layoutConfig: IAddLayoutConfig,
  ) {
    if (_.isObject(layoutConfig) && !_.isNil(this.controller)) {
      const { schema, workingMode, loadOptions } = layoutConfig
      return this.controller.loadLayout(
        engineId,
        layoutKey,
        schema,
        workingMode,
        loadOptions,
        true,
      ).then((rootNode) => {
        if (!_.isNil(this.controller) &&
          _.has(rootNode, ['layoutKey']) && rootNode.layoutKey
        ) {
          this.controller.activateLayout(rootNode.layoutKey)
        }
        return rootNode
      })
    } else {
      return undefined
    }
  }
  removeLayout(
    layoutKey: string,
    clearData?: boolean,
  ) {
    if (!_.isNil(this.controller)) {
      return this.controller.removeLayout(layoutKey, clearData)
    }
    return false
  }
  locateLayout(layoutKey?: string) {
    if (!_.isNil(this.controller)) {
      let targetLayout = this.controller.activeLayout
      if (_.isString(layoutKey) && layoutKey) {
        targetLayout = layoutKey
      }

      const renderer = _.get(this.controller.layoutMap, [targetLayout])
      if (_.isObject(renderer)) {
        const { engineId } = renderer
        return engineId
      }
    }
  }
  showLayout(layoutKey?: string) {
    if (!_.isNil(this.controller)) {
      let targetLayout = this.controller.activeLayout
      if (_.isString(layoutKey) && layoutKey) {
        targetLayout = layoutKey
      }

      return this.controller.activateLayout(targetLayout)
    }
    return false
  }
  hideLayout(layoutKey?: string) {
    if (!_.isNil(this.controller)) {
      let targetLayout = this.controller.activeLayout
      if (_.isString(layoutKey) && layoutKey) {
        targetLayout = layoutKey
      }

      return this.controller.hideLayout(targetLayout)
    }
    return false
  }

  private fetchNodes(nodes: Array<IUINode> | INodeProps) {
    let uiNodes: any;
    if (nodes instanceof UINode) {
      uiNodes = nodes;
    } else if (!_.isNil(this.controller)) {
      uiNodes = searchNodes(nodes, this.controller.activeLayout);
    }
    return uiNodes;
  }

  removeNodes(nodes: Array<IUINode> | INodeProps) {
    let uiNodes: any = this.fetchNodes(nodes);
    uiNodes.forEach((uiNode: IUINode) => {
      const parentNode: any = uiNode.parent;
      if (parentNode) {
        _.remove(parentNode.children, (node: IUINode) => {
          return node === uiNode;
        });

        _.remove(parentNode.schema.children, (schema: any) => {
          return _.isEqual(schema, uiNode.schema);
        });
        parentNode.sendMessage(true);
      }
    });
  }

  refreshNodes(nodes: Array<IUINode> | INodeProps) {
    let uiNodes: any = this.fetchNodes(nodes);
    uiNodes.forEach((uiNode: IUINode) => {
      uiNode.sendMessage(true);
    });
  }

  assignPropsToNode(nodes: Array<IUINode> | INodeProps, props: any) {}

  async updateState(nodes: Array<IUINode> | INodeProps, state: any) {
    let uiNodes: any = nodes;
    if (!_.isArray(nodes) && !_.isNil(this.controller)) {
      uiNodes = searchNodes(nodes, this.controller.activeLayout);
    }

    // update state directly
    for (let index in uiNodes) {
      const uiNode = uiNodes[index];
      await uiNode.stateNode.updateState(state);
    }
    return uiNodes;
  }

  async saveNodes(nodes: Array<IUINode> | INodeProps) {
    let uiNodes: any = nodes;
    if (!_.isArray(nodes) && !_.isNil(this.controller)) {
      uiNodes = searchNodes(nodes, this.controller.activeLayout);
    }

    let dataSources: Array<IDataSource> = [];
    // fetch data source
    uiNodes.forEach((uiNode: IUINode) => {
      dataSources.push(uiNode.dataNode.source);
    });

    // submit
    return await this.submit(dataSources);
  }

  async submit(sources: Array<IDataSource>) {
    // could stop the commit
    const exeConfig: IPluginExecuteOption = {
      afterExecute: (plugin, param, result) => {
        if (!result) {
          return { stop: true }
        }
        return {}
      }
    };
    if (!_.isNil(this.controller)) {
      const exeResult = await this.controller.pluginManager.executePlugins(
        this.controller.id,
        "data.commit.workflow.could",
        { nodeController: this.controller, sources },
        exeConfig,
      );
      const couldCommit = exeResult.results.every((result) => {
        return result.result
      })
      if (couldCommit === undefined || couldCommit === true) {
        return await submitToAPI(sources);
      } else {
        return couldCommit;
      }
    }
  }

  async submitToPool(connectOptions: IConnectOptions, refreshLayout?: string) {
    // could stop the commit
    const exeConfig: IPluginExecuteOption = {
      afterExecute: (plugin, param, result) => {
        if (!result) {
          return { stop: true }
        }
        return {}
      }
    };
    if (!_.isNil(this.controller)) {
      const exeResult = await this.controller.pluginManager.executePlugins(
        this.controller.id,
        "data.commit.workflow.could",
        { nodeController: this.controller,  sources: connectOptions },
        exeConfig,
      );
      const couldCommit = exeResult.results.every((result) => {
        return result.result
      })
      if (couldCommit === undefined || couldCommit === true) {
        const dataPool = DataPool.getInstance();
        const { source, target, options } = connectOptions;
        let clearSrc = _.get(options, "clearSource");
        const result = dataPool.transfer(source, target, { clearSrc });
        dataPool.clear(source, { clearDomain: true })
        // refresh target ui node

        let selector = connectOptions.targetSelector;
        if (!selector) {
          selector = {
            datasource: target.replace(/\[\d*\]$/, "")
          };
        }

        const selectedNodes = searchNodes(selector, refreshLayout);
        for (let index in selectedNodes) {
          const node = selectedNodes[index];
          // send message
          await node.refreshLayout();
        }
        return result;
      } else {
        return couldCommit;
      }
    }
  }

  async removeFromPool(source: string, refreshLayout?: string) {
    const dataPool = DataPool.getInstance();
    dataPool.clear(source);

    // refresh target ui node
    // only refresh parent if the path suffixed with [0] or .0
    const updateSource = source.replace(/\.?\[?\d+\]?$/, "");
    const selector = {
      datasource: updateSource
    };

    const selectedNodes = searchNodes(selector, refreshLayout);
    for (let index in selectedNodes) {
      const node = selectedNodes[index];
      // send message
      await node.refreshLayout();
    }
  }

  async updatePool(source: string, data: any, refreshLayout?: string) {
    const dataPool = DataPool.getInstance();
    dataPool.set(source, data);

    // refresh target ui node
    const selector = {
      datasource: source
    };
    const selectedNodes = searchNodes(selector, refreshLayout);
    for (let index in selectedNodes) {
      const node = selectedNodes[index];
      // send message
      await node.refreshLayout();
    }
  }
}

export default Workflow
