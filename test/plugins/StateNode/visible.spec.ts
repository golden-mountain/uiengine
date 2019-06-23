/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { UINode, Request, Cache } from "../../../src";
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
    it("visiblization should be caculated on the first initial", async () => {
      Cache.clearDataCache();
      const request = new Request(reqConfig);
      const uiNode = new UINode(
        stateNodeBasicLayout,
        request,
        "loaded-from-local-node"
      );
      const schema = await uiNode.loadLayout();
      let visible = uiNode.getStateNode().getState("visible");
      expect(visible).to.equal(true);

      // children 0:
      let child: any = uiNode.getChildren([0]);
      visible = child.getStateNode().getState("visible");
      expect(visible).to.equal(true);

      // children 1
      child = uiNode.getChildren([1]);
      visible = child.getStateNode().getState("visible");
      expect(visible).to.equal(true);

      // children 1, 0
      child = uiNode.getChildren([1, 0]);
      visible = child[0].getStateNode().getState("visible");
      // console.log(child[0].getSchema("state.visible.deps"));
      expect(visible).to.equal(true);

      // children 1, 1
      visible = child[1].getStateNode().getState("visible");
      expect(visible).to.equal(true);
    });

    it("visiblization should be caculated on the when update the schema", async () => {
      const request = new Request(reqConfig);
      const uiNode = new UINode(
        stateNodeBasicLayout,
        request,
        "loaded-from-local-node"
      );
      const schema = await uiNode.loadLayout();
      expect(schema.id).to.equal("state-node-basic");

      //replace
      const path = `${reqConfig.layoutSchemaPrefix}state-test.json`;
      const replacedSchema = await uiNode.replaceLayout(path);
      expect(replacedSchema.id).to.equal("state-test-id-1");
      const rootNodeVisible = uiNode.getStateNode().getState("visible");
      expect(rootNodeVisible).to.equal(true);

      let child: any = uiNode.getChildren([0]);
      let visible = child.getStateNode().getState("visible");
      expect(visible).to.equal(true);

      child = uiNode.getChildren([1]);
      visible = child.getStateNode().getState("visible");
      expect(visible).to.equal(false);
    });
  });
});
