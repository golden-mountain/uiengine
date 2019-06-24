/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { DataNode, Request, UINode } from "../../../../src";
// import reqConfig from "./config/request";
import reqConfig from "../../../config/request";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;
const request = new Request(reqConfig);
const uiNode = new UINode({});

describe("Given all the DataNode validation plugins", () => {
  before(() => {});
  describe("the given validaton plugin ", () => {
    it("should validate all given number rule", async () => {
      let dataNode = new DataNode("foo:bar.baz[0].age", uiNode, request);
      await dataNode.loadData();
      // const schema = dataNode.getSchema("baz");
      // negtive cases
      let couldUpdateData = await dataNode.updateData(121);
      expect(couldUpdateData).to.equal(false);
      couldUpdateData = await dataNode.updateData(-1);
      expect(couldUpdateData).to.equal(false);

      // positive cases
      couldUpdateData = await dataNode.updateData(120);
      expect(couldUpdateData).to.equal(true);
      couldUpdateData = await dataNode.updateData(1);
      expect(couldUpdateData).to.equal(true);
    });
  });
});
