/* global describe, it, before */
import React from "react";

import chai from "chai";
import reqConfig from "../config/request";
import _ from "lodash";
import { mount } from "enzyme";

import {
  UIEngineRegister,
  NodeController,
  PluginManager,
  UIEngine
} from "../../src";
import { IWorkflow, INodeController, IUINode } from "../../typings";
import * as plugins from "../../src/plugins";
// import components
import components from "../components";

const expect = chai.expect;

let nodeController: INodeController;
let workflow: IWorkflow;
const workflowMain = "layouts/workflow-main.json";
// should mount
let wrapper: any;

describe("Given an instance of Workflow library", () => {
  before(() => {
    UIEngineRegister.registerComponents(components);

    PluginManager.loadPlugins(plugins);
    nodeController = NodeController.getInstance();
    nodeController.setRequestConfig(reqConfig);
    workflow = nodeController.workflow;

    // component set
    const layouts = [workflowMain];
    const component = <UIEngine layouts={layouts} reqConfig={reqConfig} />;
    wrapper = mount(component);
  });
  describe("the given action from user side", () => {
    it("activeLayout: could active loaded or not loaded layout and show it out", async () => {
      // could load layout and turns to uinode
      const uiNode: IUINode = await workflow.activeLayout(workflowMain);
      const node = nodeController.nodes[workflowMain];
      expect(node.uiNode).to.equal(uiNode);

      // could get component's html correct
      wrapper.update();
      const expectedHTML =
        '<div>Demo Container<div>Demo sub container</div><a title="Title">link</a></div>';
      expect(wrapper.html()).to.equal(expectedHTML);

      // could fetch layout from existing nodes
      const fetchedUINode = await workflow.activeLayout(workflowMain);
      expect(fetchedUINode).to.equal(uiNode);

      // could show it on given component(like Modal, drawer, or current place default)
      let childNode = uiNode.getChildren([1]);
      await childNode.props.onClick.call();
      wrapper.update();
      const expectHTML =
        '<div>Demo Container<div>Demo sub container</div><a title="Title">link</a></div><main container="main"><div>Demo Container<div>foo.bar.name</div></div></main>';
      expect(wrapper.html()).to.equal(expectHTML);

      // activelayout should change on node controller
      const expectedLayout = "layouts/react-component-test-2.json";
      expect(nodeController.activeLayout).to.equal(expectedLayout);
    });

    it("deactiveLayout: could deactive the current active layout", () => {
      // elements should removed from dom
      workflow.deactiveLayout();
      wrapper.update();
      const expectedHTML =
        '<div>Demo Container<div>Demo sub container</div><a title="Title">link</a></div>';
      expect(wrapper.html()).to.equal(expectedHTML);
    });

    it("removeNodes: could remove nodes from current actived layout", async () => {
      const props = {
        component: "a",
        content: "link"
      };

      workflow.removeNodes(props);
      const expectedHTML =
        "<div>Demo Container<div>Demo sub container</div></div>";
      expect(wrapper.html()).to.equal(expectedHTML);
    });

    it("refreshNodes: could refresh the load already rendered", () => {});

    it("assignPropsToNode: could assign new props to selected nodes and refresh nodes", () => {});

    it("updateData: could update data and re-render the correspond node", () => {});

    it("updateState: could update state and re-render the correspond node", () => {});
    it("saveNodes: could save given ui nodes", () => {});
    it("saveSources: could save given sources", () => {});
  });
});
