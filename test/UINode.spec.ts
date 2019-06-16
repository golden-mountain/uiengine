/* global describe, it, before */

import chai from "chai";
import { UINode, Request } from "../src";
import reqConfig from "./config/request";
// import defaultSchema from "./config/default-schema";

import * as uiNodeLayout from "./layouts/uinode-basic.json";
import * as dataNodeJson from "./data/basic.json";

// const uiNodeLayout = {};
// chai.expect();

const expect = chai.expect;

let uiNodeWithRemoteRequest: any;
let uiNodeWithoutRemoteRequest: any;
uiNodeWithoutRemoteRequest = new UINode(uiNodeLayout);
const request = new Request(reqConfig);
uiNodeWithRemoteRequest = new UINode({}, request);

describe("Given an instance of my UINode library", () => {
  before(() => {});
  describe("the given schema ", () => {
    it("if schema is object, should same as constructor param", () => {
      // expect(uiNode.schema).to.be.equal(uinodeLayout);
      expect(uiNodeWithoutRemoteRequest.getSchema()).to.deep.equal(
        uiNodeLayout
      );
    });

    it("if schema is string, should load from remote and same as the loaded", async () => {
      // expect(uiNode.schema).to.be.equal(uinodeLayout);
      const promise = uiNodeWithRemoteRequest.loadLayout(
        "layouts/uinode-basic.json"
      );
      promise
        .then((res: any) => {
          // console.log(uiNodeWithRemoteRequest.getSchema());
          expect(uiNodeWithRemoteRequest.getSchema()).to.deep.equal(
            uiNodeLayout
          );
        })
        .catch((error: any) => {
          // console.log(">>>>>>>>>");
          // console.log("Error " + error.message);
        });
    });

    it("if datasource is not empty, should return a correct DataNode", async () => {
      uiNodeWithRemoteRequest.loadData("data/basic.json");
      const dataNode = uiNodeWithRemoteRequest.getDataNode();
      expect(dataNode).to.have.property("getData");
      dataNode
        .getData()
        .then((v: any) => {
          expect(dataNode.getData()).to.deep.equal(dataNodeJson);
        })
        .catch(function(error: any) {
          // console.log("Error " + error.message);
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
