/* global describe, it, before */

import chai from "chai";
import { UINode } from "../src";
import uiNodeLayout from "./layouts/uinode-basic.json";

// chai.expect();

const expect = chai.expect;

let uiNode: any;

describe("Given an instance of my UINode library", () => {
  before(() => {
    uiNode = new UINode(uiNodeLayout);
  });
  describe("the given schema ", () => {
    it("should same as constructor param", () => {
      // expect(uiNode.schema).to.be.equal(uinodeLayout);
      expect(uiNode.getSchema()).to.deep.equal(uiNodeLayout);
    });
  });
});

describe("Given an instance of my Dog library", () => {
  before(() => {
    // lib = new Dog();
  });
  describe("when I need the name", () => {
    // it("should return the name", () => {
    //   expect(lib.name).to.be.equal("Dog");
    // });
  });
});
