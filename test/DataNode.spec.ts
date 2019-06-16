/* global describe, it, before */

import chai from "chai";
import { DataNode, Request } from "../src";
import reqConfig from "./config/request";

import * as dataNodeJson from "./data/basic.json";

// const DataNodeLayout = {};
// chai.expect();

const expect = chai.expect;

let dataNode: any;
const dataSource = {
  isURL: false,
  value: dataNodeJson
};
const request = new Request(reqConfig);

describe("Given an instance of my DataNode library", () => {
  before(() => {});
  describe("the given data  ", () => {
    it("if data is object, should same as constructor param", () => {
      dataNode = new DataNode(dataSource);
      expect(dataNode.getData()).to.deep.equal(dataNodeJson);
    });

    it("if data is string, should load from remote and same as the loaded", async () => {
      dataNode = new DataNode(dataSource, request);
      const promise = dataNode.loadData("data/basic.json");
      promise.then(() => {
        expect(dataNode.getDataNode()).to.deep.equal(dataNodeJson);
      });
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
