/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import { DataNode, Request, Cache, UINode, PluginManager } from "../../src";
import reqConfig from "../config/request";

import dataNodeJson from "../data/foo.json";
import dataSchemaJson from "../data/schema/foo.json";
import uiJSON from "../layouts/state-node-basic.json";

// const DataNodeLayout = {};
// chai.expect();

chai.use(chaiSpies);
const expect = chai.expect;

const request = new Request(reqConfig);
const uiNode = new UINode({});

describe("Given an instance of my DataNode library", () => {
  before(() => {});
  describe("the given data", () => {
    it("constructor: should called getSchemaInfo & loadData", async () => {
      Cache.clearDataCache();
      const toLoadName = "foo.bar";
      const dataNode = new DataNode(toLoadName, uiNode, request);
      // const source = { name: "foo.bar", schemaPath: "foo.json" };
      const source = "foo.bar";
      expect(dataNode.source).to.be.deep.equal(source);
      await dataNode.loadData();
      expect(dataNode.getData()).to.deep.equal(_.get(dataNodeJson, toLoadName));
      // load schema test
      let schema = dataNode.getSchema();
      expect(schema).to.deep.equal(
        _.get(dataSchemaJson, `definition.${toLoadName}`)
      );

      // localObject
      const anyValue = { any: 1 };
      const dataLocalNode = new DataNode(anyValue, uiNode);
      expect(dataLocalNode.getData()).to.be.deep.equal(anyValue);
    });

    it("loadData: data should be loaded from DataEngine", async () => {
      Cache.clearDataCache();
      let dataNode = new DataNode("foo:bar", uiNode, request);
      let data = await dataNode.loadData();
      let equalData = _.get(dataNodeJson, "foo.bar");
      expect(data).to.deep.equal(equalData);
      // load from cache
      data = dataNode.getData();
      expect(data).to.deep.equal(equalData);

      // error loading
      Cache.clearDataCache();
      dataNode = new DataNode("any.wrong.node", uiNode, request);
      data = await dataNode.loadData();
      const errorCode = "Schema for any.json not found";
      const errorInfo = dataNode.dataEngine.errorInfo;
      // console.log(errorCode);
      expect(errorInfo.code).to.include(errorCode);
    });

    it("updateData: data should be checked, updated, and state should be refreshed", async () => {
      // loading schema from UINode
      Cache.clearDataCache();
      const localUINode = new UINode(uiJSON, request, "test-root-name");
      await localUINode.loadLayout();
      const child = localUINode.getChildren([0]);
      const dataNode = child.getDataNode();
      const data = dataNode.getData();
      expect(data).to.equal("Zp");

      // after updating correct data
      await dataNode.updateData("Zuoping");
      expect(dataNode.getData()).to.equal("Zuoping");

      // refresh the state
      const rowChild = localUINode.getChildren([1, 0]);
      const stateVisibleCol1 = rowChild[0].getStateNode().getState("visible");
      // console.log(rowChild[0].getSchema("state.visible.deps"));
      expect(stateVisibleCol1).to.equal(false);
      const stateVisibleCol2 = rowChild[1].getStateNode().getState("visible");
      expect(stateVisibleCol2).to.equal(false);
    });

    it("deleteData: data should be deleted by given path, layout and state should be refreshed", async () => {
      // loading schema from UINode
      Cache.clearDataCache();
      const localUINode = new UINode(uiJSON, request, "test-root-name");
      await localUINode.loadLayout();

      // refresh the state
      const rowChild = localUINode.getChildren([1]);
      const dataNode = rowChild.getDataNode();
      await dataNode.deleteData(0);
      // console.log(rowChild[0].getSchema("state.visible.deps"));
      const expectedJson = [
        {
          name: "Lifang",
          age: 30
        }
      ];
      expect(dataNode.getData()).to.deep.equal(expectedJson);
      expect(rowChild.getChildren().length).to.equal(1);
    });
  });

  after(() => {
    Cache.clearCache();
    PluginManager.unloadPlugins();
  });
});
