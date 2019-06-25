/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import { NodeController, Request, UINode, Cache, PluginManager } from "../src";
import reqConfig from "./config/request";

import uiJSON from "./layouts/state-node-basic.json";

// const DataNodeLayout = {};
// chai.expect();

chai.use(chaiSpies);
const expect = chai.expect;

const request = new Request(reqConfig);
const uiNode = new UINode({});

describe("Given an instance of my DataNode library", () => {
  before(() => {});
  describe("the given data", () => {
    it("constructor: should created a messager", () => {});

    it("loadUINode: layout should be loaded and layouts should hold the layout ", async () => {
      const nodeController = new NodeController(reqConfig);
      const schemaPath = "layouts/state-node-basic.json";
      let uiNode = await nodeController.loadUINode(schemaPath);
      expect(uiNode).is.instanceOf(UINode);
      expect(nodeController.layouts[schemaPath]).is.instanceOf(UINode);

      // load object
      uiNode = await nodeController.loadUINode(uiJSON);
      const id = _.get(uiJSON, "id", "default");
      expect(uiNode).is.instanceOf(UINode);
      expect(nodeController.layouts[id]).is.instanceOf(UINode);

      // expect a message, loaded UINode, to notice other UI layer thing render it
      // nodeController.sendMessage({}, {layout: schemaPath}, 'layout.initialized');
    });

    it("deleteLayout: should delete the given name of layout", async () => {
      const nodeController = new NodeController(reqConfig);
      const schemaPath = "layouts/state-node-basic.json";
      let uiNode = await nodeController.loadUINode(schemaPath);
      expect(uiNode).is.instanceOf(UINode);
      expect(nodeController.layouts[schemaPath]).is.instanceOf(UINode);

      // delete it
      const result = nodeController.deleteUINode(schemaPath);
      expect(result).to.be.true;
      expect(nodeController.layouts[schemaPath]).to.be.undefined;
    });

    it("getUI: should delete the given name of layout", async () => {
      const nodeController = new NodeController(reqConfig);
      const schemaPath = "layouts/state-node-basic.json";
      let uiNode = await nodeController.loadUINode(schemaPath);
      expect(nodeController.getUINode(schemaPath)).is.equal(uiNode);
    });
  });

  after(() => {
    Cache.clearCache();
    PluginManager.unloadPlugins();
  });
});
