/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { DataEngine, Request, Cache } from "../src";
import reqConfig from "./config/request";
import dataSchemaJson from "./data/schema/foo.json";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;
const request = new Request(reqConfig);

const schemaInfo = { name: "foo.bar", schemaPath: `foo.json` };

describe("Given all the DataEngine", () => {
  before(() => {});
  describe("the given source", () => {
    it("loadData: data should be loaded from remote and be cached", async () => {
      //   Cache.clearDataCache();
      //   let dataNode = new DataEngine("foo:bar", uiNode, request);
      //   // expect(dataNode.getSchema()).is.instanceOf(Promise);
      //   let schema = await dataNode.loadSchema();
      //   let endpoint = dataNode.getDataEntryPoint("get");
      //   expect(endpoint).to.equal(`${reqConfig.dataPathPrefix}foo.json`);
      //   let data = await dataNode.loadRemoteData(endpoint);
      //   let equalData = _.get(dataNodeJson, "foo.bar");
      //   expect(data).to.deep.equal(equalData);
      //   // load from cache
      //   data = dataNode.getData();
      //   expect(data).to.deep.equal(equalData);
      //   // error loading
      //   Cache.clearDataCache();
      //   dataNode = new DataNode("foo:bar", uiNode, request);
      //   data = await dataNode.loadRemoteData("any.wrong.node");
      //   const errorCode = "Cannot find module";
      //   const errorInfo = dataNode.getErrorInfo("data");
      //   // console.log(errorCode);
      //   expect(errorInfo.code).to.include(errorCode);
    });
  });
});

describe("Given all the DataMapper", () => {
  before(() => {});
  describe("the given source", () => {
    it("loadSchema: schema should be loaded from remote", async () => {
      Cache.clearDataSchemaCache();
      const dataEngine = new DataEngine(schemaInfo, request);
      // expect(dataNode.getSchema()).is.instanceOf(Promise);
      let schema = await dataEngine.loadSchema();
      //   const data = _.get(dataSchemaJson, "definition.foo.bar");
      expect(schema).to.deep.equal(dataSchemaJson);
    });
  });
});
