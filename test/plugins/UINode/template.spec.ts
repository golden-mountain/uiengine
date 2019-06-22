/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { UINode, Request } from "../../../src";
// import reqConfig from "./config/request";
import stateTestLayout from "../../layouts/state-test.json";
import templateLayout from "../../layouts/ui-template-definition.json";
import reqConfig from "../../config/request";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;

describe("Given all the UI plugins", () => {
  before(() => {});
  describe("the given template plugin ", async () => {
    it("if template definiation provided, should load it from remote and replace current Node", async () => {
      const request = new Request(reqConfig);
      const uiNode = new UINode(templateLayout, request);
      const result = await uiNode.loadLayout();
      console.log(result);

      // schema should be loaded
      const theChild = uiNode.getChildren([1]);
      const schema = theChild.getSchema();
      expect(schema).to.deep.equal(stateTestLayout);

      // can get loaded schema's node's schema
      const templateChild = theChild.getChildren([0]);
      const expectedSchema = _.get(stateTestLayout, "children[0]");
      expect(templateChild.getSchema()).to.deep.equal(expectedSchema);
    });
  });
});
