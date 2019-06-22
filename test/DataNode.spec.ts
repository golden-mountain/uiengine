/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import { DataNode, Request, Cache, UINode } from "../src";
import reqConfig from "./config/request";

import dataNodeJson from "./data/foo.json";
import dataSchemaJson from "./data/schema/foo.json";
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
    it("constructor: should called getSchemaInfo & loadData", async () => {
      //DataNode.clearCache();
      const toLoadName = "foo.bar";
      const dataNode = new DataNode(toLoadName, uiNode, request);
      const source = { name: "foo.bar", schemaPath: "foo.json" };
      expect(dataNode.getSource()).to.be.deep.equal(source);
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

    it("getSchemaInfo: if source is string, the source should translate to IDataSourceInfo", async () => {
      const dataNode = new DataNode({}, uiNode);
      let sourceInfo = dataNode.getSchemaInfo("foo:bar.baz");
      let expectInfo = {
        name: "foo.bar.baz",
        schemaPath: "foo.json"
      };
      expect(sourceInfo).to.be.deep.equal(expectInfo);

      sourceInfo = dataNode.getSchemaInfo("foo.bar.baz");
      expect(sourceInfo).to.be.deep.equal(expectInfo);

      sourceInfo = dataNode.getSchemaInfo("foo");
      expectInfo = {
        name: "foo",
        schemaPath: "foo.json"
      };
      expect(sourceInfo).to.be.deep.equal(expectInfo);
    });

    it("loadSchema: schema should be loaded from remote", async () => {
      Cache.clearDataSchemaCache();
      let dataNode = new DataNode("foo:bar", uiNode, request);
      // expect(dataNode.getSchema()).is.instanceOf(Promise);
      let schema = await dataNode.loadSchema();
      const data = _.get(dataSchemaJson, "definition.foo.bar");
      expect(schema).to.deep.equal(data);

      // load from cache
      schema = dataNode.getSchema();
      expect(schema).to.deep.equal(data);

      // error loading
      dataNode = new DataNode("foola.bar", uiNode, request);
      schema = await dataNode.loadSchema();
      const errorCode = "Cannot find module";
      const errorInfo = dataNode.getErrorInfo("schema");
      // console.log(errorCode);
      expect(errorInfo.code).to.include(errorCode);
    });

    it("loadRemoteData: data should be loaded from remote and be cached", async () => {
      Cache.clearDataCache();
      let dataNode = new DataNode("foo:bar", uiNode, request);
      // expect(dataNode.getSchema()).is.instanceOf(Promise);
      let schema = await dataNode.loadSchema();
      let endpoint = dataNode.getDataEntryPoint("get");
      expect(endpoint).to.equal(`${reqConfig.dataPathPrefix}foo.json`);
      let data = await dataNode.loadRemoteData(endpoint);
      let equalData = _.get(dataNodeJson, "foo.bar");
      expect(data).to.deep.equal(equalData);
      // load from cache
      data = dataNode.getData();
      expect(data).to.deep.equal(equalData);

      // error loading
      Cache.clearDataCache();
      dataNode = new DataNode("foo:bar", uiNode, request);
      data = await dataNode.loadRemoteData("any.wrong.node");
      const errorCode = "Cannot find module";
      const errorInfo = dataNode.getErrorInfo("data");
      // console.log(errorCode);
      expect(errorInfo.code).to.include(errorCode);
    });

    it("updateData: data should be checked, updated, and state should refreshed", async () => {
      // loading schema from UINode
      Cache.clearDataCache();
      const localUINode = new UINode(uiJSON, request, "test-root-name");
      await localUINode.loadLayout();
      const child = localUINode.getChildren([0]);
      const dataNode = child.getDataNode();
      const data = dataNode.getData();
      expect(data).to.equal("Zp");
      // after updating correct data
      console.log("<<<<<to update visible");
      await dataNode.updateData("Zuoping");
      console.log(">>>>>> updated");
      expect(dataNode.getData()).to.equal("Zuoping");

      // refresh the state
      const rowChild = localUINode.getChildren([1, 0]);
      const stateVisibleCol1 = rowChild[0].getStateNode().getState("visible");
      expect(stateVisibleCol1).to.equal(false);
      const stateVisibleCol2 = rowChild[1].getStateNode().getState("visible");
      expect(stateVisibleCol2).to.equal(false);
    });
  });
});
