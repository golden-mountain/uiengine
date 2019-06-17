/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
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
      const dataNode = new DataNode("foo:bar", request);
      // expect(spy).to.have.been.called.once;
      // expect(dataNode.getSchema()).instanceOf(Promise);
      // dataNode.getSchema().then((v: any) => {
      //   // console.log(v);
      //   // const spy = chai.spy.on(dataNode, "loadData");
      //   expect(dataNode.getData()).instanceOf(Promise);
      //   dataNode.getData().then((d: any) => {
      //     // console.log(d, "<<<<<<<<<<<<<<<");
      //     expect(dataNode.getData()).to.deep.equal(dataNodeJson);
      //   });
      // });
      const schema = await dataNode.getSchema();
      expect(dataNode.getSchema()).to.deep.equal(dataSchemaJson);
      const res = await dataNode.getData();
      expect(dataNode.getData()).to.deep.equal(dataNodeJson);
    });

    // it("loadData & getData: if data is string, should load from remote and same as the loaded", async () => {
    //   const dataNode = new DataNode(dataSource, request);
    //   const promise = dataNode.loadRemoteData(
    //     `${reqConfig.mockDataPrefix}/basic.json`
    //   );
    //   promise
    //     .then(() => {
    //       expect(dataNode.getData()).to.deep.equal(dataNodeJson);
    //     })
    //     .catch(function(error: any) {
    //       console.log(error.message);
    //     });
    // });

    // it("loadSchema: the remote loaded schema should same as local test loaded", () => {
    //   const dataNode = new DataNode(dataSource, request);
    //   let promise = dataNode.loadSchema();
    //   promise
    //     .then(() => {
    //       expect(dataNode.getSchema()).to.deep.equal(dataSchemaJson);
    //       expect(dataNode.getCache()).to.deep.equal(dataSchemaJson);
    //     })
    //     .catch(function(error: any) {
    //       console.log(error.message);
    //     });
    // });
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
