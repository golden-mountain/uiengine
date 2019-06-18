/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import { DataNode, Request, Cache } from "../src";
import reqConfig from "./config/request";

import dataNodeJson from "./data/foo.json";
import dataSchemaJson from "./data/schema/foo.json";

// const DataNodeLayout = {};
// chai.expect();

chai.use(chaiSpies);
const expect = chai.expect;

const request = new Request(reqConfig);

describe("Given an instance of my DataNode library", () => {
  before(() => {});
  describe("the given data", () => {
    it("constructor: should called getSchemaInfo & loadData", async () => {
      //DataNode.clearCache();
      const toLoadName = "foo.bar";
      const dataNode = new DataNode(toLoadName, request);
      const source = { name: "foo.bar", schemaPath: "foo.json" };
      expect(dataNode.getSource()).to.be.deep.equal(source);
      let data = await dataNode.loadData();
      expect(dataNode.getData()).to.deep.equal(_.get(dataNodeJson, toLoadName));
      // load schema test
      let schema = dataNode.getSchema();
      expect(schema).to.deep.equal(
        _.get(dataSchemaJson, `definition.${toLoadName}`)
      );

      // localObject
      const anyValue = { any: 1 };
      const dataLocalNode = new DataNode(anyValue);
      expect(dataLocalNode.getData()).to.be.deep.equal(anyValue);
    });

    it("getSchemaInfo: if source is string, the source should translate to IDataSourceInfo", async () => {
      const dataNode = new DataNode({});
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
      let dataNode = new DataNode("foo:bar", request);
      // expect(dataNode.getSchema()).is.instanceOf(Promise);
      let schema = await dataNode.loadSchema();
      const data = _.get(dataSchemaJson, "definition.foo.bar");
      expect(schema).to.deep.equal(data);

      // load from cache
      schema = dataNode.getSchema();
      expect(schema).to.deep.equal(data);

      // error loading
      dataNode = new DataNode("foola.bar", request);
      schema = await dataNode.loadSchema();
      const errorCode = "Cannot find module";
      const errorInfo = dataNode.getErrorInfo("schema");
      // console.log(errorCode);
      expect(errorInfo.code).to.include(errorCode);
    });

    it("loadRemoteData: data should be loaded from remote and be cached", async () => {
      Cache.clearDataCache();
      let dataNode = new DataNode("foo:bar", request);
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
      dataNode = new DataNode("foo:bar", request);
      data = await dataNode.loadRemoteData("any.wrong.node");
      const errorCode = "Cannot find module";
      const errorInfo = dataNode.getErrorInfo("data");
      // console.log(errorCode);
      expect(errorInfo.code).to.include(errorCode);
    });
  });
});
