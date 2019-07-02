/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { UINode, Request, UIEngineRegister } from "../../../src";
// import reqConfig from "./config/request";
import propLayout from "../../layouts/uinode-props.json";
import reqConfig from "../../config/request";
import * as plugins from "../../../src/plugins";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;

describe("Given all the UI plugins", () => {
  before(() => {
    UIEngineRegister.registerPlugins(plugins);
  });
  describe("the given props plugin ", async () => {
    it("props could parsed as required", async () => {
      const request = new Request(reqConfig);
      const uiNode = new UINode(propLayout, request);
      await uiNode.loadLayout();

      // schema should be loaded
      const theChild = uiNode.getChildren([1, 0, 0]);
      expect(theChild.props).to.have.property("onChange");

      // const onChange = theChild.props.onChange;
      // const spy = chai.spy.on(theChild.props, "onChange");
      // onChange("asdklfjasdf");
      // expect(spy).to.be.called.once;
    });
  });
});
