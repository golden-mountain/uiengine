/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import { DataNode, Request } from "../src";
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
      DataNode.clearCache();
      const toLoadName = "foo.bar";
      const dataNode = new DataNode(toLoadName, request);
      expect(dataNode.getSchema()).is.instanceOf(Promise);
      // load schema test
      const schema = await dataNode.getSchema();
      expect(dataNode.getSchema()).to.deep.equal(schema.data);
      expect(dataNode.getSchema()).to.deep.equal(dataSchemaJson);
      // load data test
      expect(dataNode.getData()).is.instanceOf(Promise);
      const res = await dataNode.getData();
      expect(dataNode.getData()).to.deep.equal(_.get(res.data, toLoadName));
      expect(dataNode.getData()).to.deep.equal(_.get(dataNodeJson, toLoadName));
      // load cached data
      // const spy = chai.spy.on(dataNode, "loadSchema");
      // expect(dataNode.loadData()).to.deep.equal(
      //   _.get(dataNodeJson, toLoadName)
      // );
      // expect(spy).have.not.been.called;

      // localObject
      const dataLocalNode = new DataNode(dataNodeJson);
      expect(dataLocalNode.getData()).to.be.deep.equal(dataNodeJson);
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

    it("loadSchema: schema should be loaded from remote and be cached", async () => {
      DataNode.clearCache();
      const dataNode = new DataNode("foo:bar", request);
      expect(dataNode.getSchema()).is.instanceOf(Promise);
      let schema = await dataNode.getSchema();
      expect(dataNode.getSchema()).to.deep.equal(dataSchemaJson);

      // load from cache
      schema = await dataNode.loadSchema();
      expect(schema).to.deep.equal(dataSchemaJson);
    });

    it("loadRemoteData: data should be loaded from remote and be cached", async () => {
      const dataNode = new DataNode({}, request);
      // const source: any = dataNode.getSchemaInfo("foo:bar");
      // const endpoint = dataNode.getDataEntryPoint("get");
      let source = "data/foo.json";
      let data = await dataNode.loadRemoteData(source);
      expect(dataNode.getData()).to.be.undefined;

      source = "data/wrong.json";
      data = await dataNode.loadRemoteData(source);
      const errorInfo = {
        code: `Error loading from ${source}`
      };
      expect(dataNode.getErrorInfo()).to.be.deep.equal(errorInfo);
    });
  });
});

// describe("Given an instance of my Dog library", () => {
//   before(() => {
//     // lib = new Dog();
//   });
//   describe("when I need the name", () => {
//     // it("should return the name", () => {
//     //   expect(lib.name).to.be.equal("Dog");
//     // });
//   });
// });
