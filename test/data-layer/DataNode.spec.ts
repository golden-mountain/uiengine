/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import {
  DataNode,
  Request,
  Cache,
  UINode,
  PluginManager,
  UIEngineRegister,
  DataPool,
  submitToAPI
} from "../../src";
import reqConfig from "../config/request";
// import { mount } from "enzyme";
import * as plugins from "../../src/plugins";

import dataNodeJson from "../data/foo.json";
import dataSchemaJson from "../data/schema/foo.json";
import uiJSON from "../layouts/state-node-basic.json";

// const DataNodeLayout = {};
// chai.expect();

chai.use(chaiSpies);
const expect = chai.expect;

const request = Request.getInstance();
request.setConfig(reqConfig);
const uiNode = new UINode({});

describe("Given an instance of my DataNode library", () => {
  before(() => {
    UIEngineRegister.registerPlugins(plugins);
  });
  describe("the given data", () => {
    it("constructor: should called getSchemaInfo & loadData", async () => {
      Cache.clearDataCache();
      const toLoadName = "foo.bar";
      const dataNode = new DataNode(toLoadName, uiNode, request);
      // const source = { name: "foo.bar", schemaPath: "foo.json" };
      const source = "foo.bar";
      const expectedSource = { source, autoload: true };
      expect(dataNode.source).to.be.deep.equal(expectedSource);
      await dataNode.loadData();
      expect(dataNode.getData()).to.deep.equal(_.get(dataNodeJson, toLoadName));
      // load schema test
      let schema = dataNode.getSchema();
      expect(schema).to.deep.equal(
        _.get(dataSchemaJson, `definition.${toLoadName}`)
      );

      // localObject
      const anyData = { any: 1 };
      const anySource = { source: "", defaultValue: anyData };
      const dataLocalNode = new DataNode(anySource, uiNode);
      expect(dataLocalNode.getData()).to.be.deep.equal(anyData);
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
      let rowChild = localUINode.getChildren([1, 0, 0]);
      const stateVisibleCol1 = rowChild.getStateNode().getState("visible");
      // console.log(rowChild[0].getSchema("state.visible.deps"));
      expect(stateVisibleCol1).to.equal(false);
      rowChild = localUINode.getChildren([1, 0, 1]);
      const stateVisibleCol2 = rowChild.getStateNode().getState("visible");
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

    it("submit: should submit the data pool's data into remote or connect to data pool", async () => {
      Cache.clearDataCache();
      const dataPool = DataPool.getInstance();
      dataPool.clear();
      // commit to remote using data engine
      let dataNode = new DataNode("foo:bar", uiNode, request);
      await dataNode.loadData();

      let expectedResult = [dataNodeJson];

      // remote commit
      let dataSource = "foo:bar";
      let result = await submitToAPI([dataSource], "get");
      expect(result).to.deep.equal(expectedResult);

      // local commit
      let expectedResult2 = {
        name: "Zp",
        baz: [{ name: "Rui", age: 30 }, { name: "Lifang", age: 30 }]
      };
      result = dataPool.merge(dataSource, "data:any");
      expect(dataNode.dataPool.get("data:any", false)).to.deep.equal(
        expectedResult2
      );
    });
  });

  after(() => {
    Cache.clearCache();
    PluginManager.unloadPlugins();
  });
});
