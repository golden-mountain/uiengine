/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { UINode, Request } from "../../../src";
// import reqConfig from "./config/request";
import stateNodeBasicLayout from "../../layouts/state-node-basic.json";
import reqConfig from "../../config/request";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;

describe("Given all the default plugins", () => {
  before(() => {});
  describe("the given plugins ", () => {
    it("visiblization should be caculated ", async () => {
      const request = new Request(reqConfig);
      const uiNode = new UINode(stateNodeBasicLayout, request);
      const schema = await uiNode.loadLayout();
      let visible = uiNode.getStateNode().getState("visible");
      expect(visible).to.equal(true);

      // children 0:
      let child = uiNode.getChildren(0);
      visible = child.getStateNode().getState("visible");
      expect(visible).to.equal(true);

      // children 1
      child = uiNode.getChildren(1);
      visible = child.getStateNode().getState("visible");
      expect(visible).to.equal(true);

      // children 1, 0
      child = uiNode.getChildren(1, 0);
      visible = child[0].getStateNode().getState("visible");
      expect(visible).to.equal(true);

      // children 1, 1
      visible = child[1].getStateNode().getState("visible");

      // depends on following state
      //{
      //     "prop": "id",
      //     "id": "for.bar.baz.$.name",
      //     "data": ""
      // }
      expect(visible).to.equal(false);
    });
  });
});
