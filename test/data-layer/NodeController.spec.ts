/* global describe, it, before */
import React, { useState } from "react";

import chai from "chai";
import chaiSpies from "chai-spies";
import { shallow } from "enzyme";

import _ from "lodash";
import {
  NodeController,
  UINode,
  Cache,
  PluginManager,
  searchNodes
} from "../../src";
import reqConfig from "../config/request";

import uiJSON from "../layouts/state-node-basic.json";

// const DataNodeLayout = {};
// chai.expect();

chai.use(chaiSpies);
const expect = chai.expect;

describe("Given an instance of my NodeController library", () => {
  before(() => {});
  describe("the given data", () => {
    it("constructor: should created a messager", () => {});

    it("loadUINode: layout should be loaded and layouts should hold the layout ", async () => {
      const nodeController = NodeController.getInstance();
      nodeController.setRequestConfig(reqConfig);
      const schemaPath = "layouts/state-node-basic.json";
      const id = "any-id";
      let uiNode = await nodeController.loadUINode(schemaPath, id);
      expect(uiNode).is.instanceOf(UINode);
      expect(nodeController.nodes[id]).to.have.all.keys(["uiNode", "options"]);

      // load object
      uiNode = await nodeController.loadUINode(uiJSON);
      expect(uiNode).is.instanceOf(UINode);
      expect(nodeController.nodes[id]).to.have.all.keys(["uiNode", "options"]);

      // expect a message, loaded UINode, to notice other UI layer thing render it
      // nodeController.sendMessage({}, {layout: schemaPath}, 'layout.initialized');
    });

    it("deleteLayout: should delete the given name of layout", async () => {
      const nodeController = NodeController.getInstance();
      nodeController.setRequestConfig(reqConfig);
      const schemaPath = "layouts/state-node-basic.json";
      let uiNode = await nodeController.loadUINode(schemaPath);
      expect(uiNode).is.instanceOf(UINode);
      expect(nodeController.nodes[schemaPath]).to.have.all.keys([
        "uiNode",
        "options"
      ]);

      // delete it
      const result = nodeController.deleteUINode(schemaPath);
      expect(result).to.be.true;
      expect(nodeController.nodes[schemaPath]).to.be.undefined;
    });

    it("getUI: should get the given name of layout", async () => {
      const nodeController = NodeController.getInstance();
      nodeController.setRequestConfig(reqConfig);
      const schemaPath = "layouts/state-node-basic.json";
      let uiNode = await nodeController.loadUINode(schemaPath);
      expect(nodeController.getUINode(schemaPath, true)).is.equal(uiNode);
    });

    it("sendMessage: should set ui nodes state by selector & ids", async () => {
      Cache.clearCache();

      const nodeController = NodeController.getInstance();
      nodeController.setRequestConfig(reqConfig);
      const schemaPath = "layouts/state-node-basic.json";
      const id = "test-id";
      let uiNode = await nodeController.loadUINode(schemaPath, id);
      const selector = {
        component: "lib:DemoElement2",
        id: "id-of-demo-element-1"
        // "datasource": "foo:bar.name"
      };

      const anyValue = "any.value";
      const searchedNodes = searchNodes(selector, uiNode.rootName);
      expect(searchedNodes.length).to.equal(1);
      const spy = chai.spy.on(searchedNodes[0].messager, "sendMessage");
      nodeController.castMessage(selector, anyValue, [id]);
      expect(spy).to.be.called.once;
    });
  });

  after(() => {
    Cache.clearCache();
    PluginManager.unloadPlugins();
  });
});
