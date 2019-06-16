/* global describe, it, before */

import chai from "chai";
import { UINode } from "../src";
import reqConfig from "./config/request";

import * as uiNodeLayout from "./layouts/uinode-basic.json";

// const uiNodeLayout = {};
// chai.expect();

const expect = chai.expect;

let uiNode: any;

describe("Given an instance of my UINode library", () => {
  before(() => {});
  describe("the given schema ", () => {
    it("if schema is object, should same as constructor param", () => {
      // expect(uiNode.schema).to.be.equal(uinodeLayout);
      uiNode = new UINode(uiNodeLayout);
      expect(uiNode.getSchema()).to.deep.equal(uiNodeLayout);
    });

    it("if schema is string, should load from remote and same as the loaded", async () => {
      // expect(uiNode.schema).to.be.equal(uinodeLayout);
      uiNode = new UINode({}, reqConfig);
      const promise = uiNode.loadLayout("layouts/uinode-basic.json");
      promise.then(() => {
        expect(uiNode.getSchema()).to.deep.equal(uiNodeLayout);
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
