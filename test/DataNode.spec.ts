/* global describe, it, before */

import chai from "chai";
import { DataNode, Request } from "../src";
import reqConfig from "./config/request";

import dataNodeJson from "./data/basic.json";

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
  describe("the given data", () => {
    it("getData: if data is object, should same as constructor param", () => {
      dataNode = new DataNode(dataSource);
      expect(dataNode.getData()).to.deep.equal(dataNodeJson);
    });

    it("loadData & getData: if data is string, should load from remote and same as the loaded", async () => {
      dataNode = new DataNode(dataSource, request);
      const promise = dataNode.loadData("data/basic.json");
      promise
        .then(() => {
          expect(dataNode.getData()).to.deep.equal(dataNodeJson);
        })
        .catch(function(error: any) {
          console.log("Error " + error.message);
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
