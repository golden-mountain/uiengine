/* global describe, it, before */
import React from "react";

import chai from "chai";
import reqConfig from "../config/request";
import _ from "lodash";
import { mount } from "enzyme";
import chaiSpies from "chai-spies";

import {
  UIEngineRegister,
  NodeController,
  PluginManager,
  UIEngine,
  searchNodes,
  parseRootName,
  DataPool,
  Cache,
  Request
} from "../../src";
import { IWorkflow, INodeController, IUINode } from "../../typings";
import * as plugins from "../../src/plugins";
// import components
import components from "../components";

// load demo data
// import fooData from "../data/foo.json";

const expect = chai.expect;
chai.use(chaiSpies);

let nodeController: INodeController;
let workflow: IWorkflow;
const workflowMain = "layouts/workflow-main.json";
// should mount
let wrapper: any;
let dataPool: any;

describe("Given an instance of Workflow library", () => {
  before(() => {
    Cache.clearCache();
    UIEngineRegister.registerComponents(components);

    PluginManager.loadPlugins(plugins);
    nodeController = NodeController.getInstance();
    nodeController.setRequestConfig(reqConfig);
    workflow = nodeController.workflow;
    nodeController.setWorkingMode(workflowMain, { mode: "edit" });

    // component set
    const layouts = [workflowMain];
    const component = <UIEngine layouts={layouts} reqConfig={reqConfig} />;
    wrapper = mount(component);

    // datapool
    dataPool = DataPool.getInstance();
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
        '<div>Demo Container<div>Demo sub container</div><a title="Title">link</a><main container="main" parentnode="[object Object]"><div>Demo Container<div>foo.bar.name</div></div></main></div>';
      expect(wrapper.html()).to.equal(expectHTML);

      // activelayout should change on node controller
      const expectedLayout = "layouts/react-component-test-2.json";
      expect(nodeController.activeLayout).to.equal(expectedLayout);
    });

    it("deactiveLayout: could deactive the current active layout", () => {
      // elements should hide from dom
      workflow.deactiveLayout();
      wrapper.update();
      const expectedHTML =
        '<div>Demo Container<div>Demo sub container</div><a title="Title">link</a></div>';
      expect(wrapper.html()).to.equal(expectedHTML);
      // activelayout should change on node controller
      expect(nodeController.activeLayout).to.equal(workflowMain);
    });

    it("removeNodes: could remove nodes from current actived layout", () => {
      const props = {
        component: "a",
        content: "link"
      };

      workflow.removeNodes(props);
      const expectedHTML =
        "<div>Demo Container<div>Demo sub container</div></div>";
      expect(wrapper.html()).to.equal(expectedHTML);
    });

    it("refreshNodes: could refresh the load already rendered", () => {
      const selector = {
        component: "test:DivContainer",
        datasource: "workflow:node1"
      };

      const rootName = parseRootName(nodeController.activeLayout);
      const node = searchNodes(selector, rootName);
      const spy = chai.spy.on(node[0], "sendMessage");
      workflow.refreshNodes(selector);
      expect(spy).to.be.called.once;
      chai.spy.restore(node[0]);
    });

    it("assignPropsToNode: could assign new props to selected nodes and refresh nodes", () => {
      // refresh nodes
      const selector = {
        datasource: "workflow:node1"
      };

      const selectedNodes = searchNodes(selector);
    });

    it("updateState: could update state and re-render the correspond node", async () => {
      const stateJson = "layouts/state-test.json";
      const uiNode = await workflow.activeLayout(stateJson);
      const selector = {
        id: "state-test-id-3"
      };
      await workflow.updateState(selector, { visible: false });
      // const rootName = parseRootName(stateJson);
      const sourceNodes = searchNodes(selector);
      expect(sourceNodes[0].stateNode.state.visible).to.be.true;

      const affectedSelector = {
        id: "state-test-id-2"
      };
      const targetNodes = searchNodes(affectedSelector);
      expect(targetNodes[0].stateNode.state.visible).to.be.false;
      // clear the state-test.json
      nodeController.deleteUINode(stateJson);
    });

    it("submitToPool: could submit from source to target, and update the target ui node", async () => {
      const reactComponentTestLayout = "layouts/react-component-test.json";
      // must set to edit mode, otherwise the layout default don't load any data
      // from api
      const uiNode = await workflow.activeLayout(reactComponentTestLayout);
      const node = nodeController.nodes[reactComponentTestLayout];
      expect(node.uiNode).to.equal(uiNode);
      // wrapper.update();

      // data pool should have data after actived the layout
      const expectedData = [
        { name: "Rui", age: 30 },
        { name: "Lifang", age: 30 }
      ];
      expect(dataPool.get("foo:bar.baz", false)).to.deep.equal(expectedData);

      const targetData = [
        { name: "XuJain", age: 29 },
        { name: "Rui", age: 30 }
      ];
      expect(dataPool.get("workflow:node1", false)).to.deep.equal(targetData);

      // after submit to data pool
      // expect the related data source to be refreshed
      const connectOptions = {
        source: "foo:bar.baz",
        target: "workflow:node1",
        options: { clearSource: true }
      };
      const selector = {
        datasource: "workflow:node1"
      };
      // const rootName = parseRootName(workflowMain);
      const selectedNodes = searchNodes(selector);
      const spy = chai.spy.on(selectedNodes[0], "sendMessage");
      await workflow.submitToPool(connectOptions);

      // should refresh the target uiNodes
      expect(spy).to.be.called.once;
      chai.spy.restore(selectedNodes[0]);

      // the target data should collect
      expectedData.unshift({ name: "XuJain", age: 29 });
      expect(dataPool.get("workflow:node1", false)).to.deep.equal(expectedData);

      // the data node data should keep consistence with data pool
      expect(selectedNodes[0].dataNode.data).to.deep.equal(expectedData);
    });

    it("removeFromPool: could remove the given source and update the related uiNodes", async () => {
      const removePath = "workflow:node1[0]";
      // refresh nodes
      const selector = {
        datasource: "workflow:node1"
      };

      const selectedNodes = searchNodes(selector);
      const spy = chai.spy.on(selectedNodes[0], "sendMessage");
      await workflow.removeFromPool(removePath);
      const expectedData = [
        { name: "Rui", age: 30 },
        { name: "Lifang", age: 30 }
      ];

      expect(dataPool.get("workflow:node1", false)).to.deep.equal(expectedData);

      // const spy = selectedNodes[0].sendMessage;
      expect(spy).to.be.called.once;
      chai.spy.restore(selectedNodes[0]);

      // the data node data should keep consistence with data pool
      expect(selectedNodes[0].dataNode.data).to.deep.equal(expectedData);
    });

    it("updatePool: could update given source with given data, and also can refresh the uiNodes", async () => {
      const source = "workflow:node1";
      const newData = dataPool.get(source, false);
      newData.push({ name: "XuJain", age: 29 });

      // refresh nodes
      const selector = {
        datasource: source
      };
      const selectedNodes = searchNodes(selector);
      const spy = chai.spy.on(selectedNodes[0], "sendMessage");
      await workflow.updatePool(source, newData);
      expect(spy).to.be.called.once;
      chai.spy.restore(selectedNodes[0]);

      expect(dataPool.get(source, false)).to.deep.equal(newData);
      // the data node data should keep consistence with data pool
      expect(selectedNodes[0].dataNode.data).to.deep.equal(newData);
    });

    it("saveNodes: could save given ui nodes", async () => {
      const source = "workflow:node1";
      // refresh nodes
      const selector = {
        datasource: source
      };
      const selectedNodes = searchNodes(selector);
      const request = Request.getInstance();
      chai.spy.restore(request);
      const spy = chai.spy.on(request, "post");
      // search by ui nodes
      const resopnses1 = await workflow.saveNodes(selectedNodes);
      const url = "data/workflow/{name}";
      const callParams = {
        workflow: {
          node1: [
            { name: "Rui", age: 30 },
            { name: "Lifang", age: 30 },
            { name: "XuJain", age: 29 }
          ]
        }
      };
      expect(spy).called.with(url, callParams);

      // search ui props
      const resopnses2 = await workflow.saveNodes(selector);
      expect(spy).called.with(url, callParams);
    });

    it("submit: could save given sources", async () => {
      const source = "workflow:node1";
      const submitSources = [{ source }];
      const request = Request.getInstance();
      chai.spy.restore(request);

      const spy = chai.spy.on(request, "post");
      const responses = await workflow.submit(submitSources);
      const callParams = {
        workflow: {
          node1: [
            { name: "Rui", age: 30 },
            { name: "Lifang", age: 30 },
            { name: "XuJain", age: 29 }
          ]
        }
      };
      expect(spy).called.with("data/workflow/{name}", callParams);
      chai.spy.restore(request);
    });

    after(() => {
      Cache.clearCache();
      PluginManager.unloadPlugins();
    });
  });
});
