/* global describe, it, before */

import chai from "chai";
import reqConfig from "../config/request";
import _ from "lodash";
import { Workflow, NodeController, PluginManager } from "../../src";
import { IWorkflow, INodeController, IUINode } from "../../typings";
import * as plugins from "../../src/plugins";

const expect = chai.expect;

let nodeController: INodeController;
let workflow: IWorkflow;
const workflowMain = "layouts/workflow-main.json";

describe("Given an instance of Workflow library", () => {
  before(() => {
    PluginManager.loadPlugins(plugins);
    nodeController = NodeController.getInstance();
    nodeController.setRequestConfig(reqConfig);
    workflow = nodeController.workflow;
  });
  describe("the given action from user side", () => {
    it("activeLayout: could active loaded or not loaded layout and show it out", async () => {
      // could load layout and turns to uinode
      const uiNode: IUINode = await workflow.activeLayout(workflowMain);
      const node = nodeController.nodes[workflowMain];
      expect(node.uiNode).to.equal(uiNode);

      // could fetch layout
      const fetchedUINode = await workflow.activeLayout(workflowMain);
      expect(fetchedUINode).to.equal(uiNode);

      // could show it on given component(like Modal, drawer, or current place default)
      let childNode = uiNode.getChildren([1]);
      childNode.props.onClick.call();
    });

    it("deactiveLayout: could deactive the current active layout", () => {});

    it("removeNodes: could remove nodes from current actived layout", () => {});

    it("refreshNodes: could refresh the load already rendered", () => {});

    it("assignPropsToNode: could assign new props to selected nodes and refresh nodes", () => {});

    it("updateData: could update data and re-render the correspond node", () => {});

    it("updateState: could update state and re-render the correspond node", () => {});
  });
});
