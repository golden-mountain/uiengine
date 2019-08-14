/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import {
  UINode,
  Request,
  Cache,
  UIEngineRegister,
  DataPool
} from "../../../src";
// import reqConfig from "./config/request";
import stateNodeBasicLayout from "../../layouts/state-node-basic.json";
import reqConfig from "../../config/request";
import * as plugins from "../../../src/plugins";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;

describe("Given all the default plugins", () => {
  before(() => {
    Cache.clearDataCache();
    const dataPool = DataPool.getInstance();
    dataPool.clear();
    UIEngineRegister.registerPlugins(plugins);
  });
  describe("the given plugins ", () => {
    it("visiblization should be caculated on the first initial", async () => {
      const request = Request.getInstance();
      request.setConfig(reqConfig);
      const uiNode = new UINode(
        stateNodeBasicLayout,
        request,
        "loaded-from-local-node"
      );
      const schema = await uiNode.loadLayout();
      let visible = uiNode.stateNode.getState("visible");
      expect(visible).to.equal(true);

      // children 0:
      let child: any = uiNode.getChildren([0]);
      visible = child.stateNode.getState("visible");
      expect(visible).to.equal(true);

      // children 1
      child = uiNode.getChildren([1]);
      visible = child.stateNode.getState("visible");
      expect(visible).to.equal(true);

      // children 1, 0
      child = child.getChildren([1, 0]);
      visible = child.stateNode.getState("visible");
      // console.log(child[0].getSchema("state.visible.deps"));
      expect(visible).to.equal(true);

      // children 1, 1
      visible = child.stateNode.getState("visible");
      expect(visible).to.equal(true);
    });

    it("visiblization should be caculated on the when update the schema", async () => {
      const request = Request.getInstance();
      request.setConfig(reqConfig);
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
      const rootNodeVisible = uiNode.stateNode.getState("visible");
      expect(rootNodeVisible).to.equal(true);

      let child: any = uiNode.getChildren([0]);
      let visible = child.stateNode.getState("visible");
      expect(visible).to.equal(true);

      child = uiNode.getChildren([1]);
      visible = child.stateNode.getState("visible");
      expect(visible).to.equal(false);
    });
  });
});
