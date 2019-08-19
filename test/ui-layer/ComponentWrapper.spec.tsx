/* global describe, it, before */
import React from "react";

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import { mount } from "enzyme";

import {
  UIEngineRegister,
  ComponentWrapper,
  UINode,
  Request,
  Cache
} from "../../src/";
import reactComponentTestJson from "../layouts/react-component-test.json";
import reqConfig from "../config/request";
import widgetConfig from "../config/widgets";

// import components
import components from "../components";
import * as plugins from "../../src/plugins";

chai.use(chaiSpies);
const expect = chai.expect;
const request = Request.getInstance();
request.setConfig(reqConfig);

//  assign elements
let uiNode: any, schema: any, wrapper: any;
// https://airbnb.io/enzyme/docs/api/ShallowWrapper/html.html
describe("Given an instance of ComponentWrapper library", () => {
  before(async () => {
    Cache.clearCache();
    UIEngineRegister.registerComponents(components);
    UIEngineRegister.registerPlugins(plugins);

    uiNode = new UINode(
      reactComponentTestJson,
      request,
      "react-component-test"
    );
    schema = await uiNode.loadLayout();
    wrapper = mount(<ComponentWrapper uiNode={uiNode} key="test" />);
  });

  describe("the given ui nodes", () => {
    it("should rendered as UI", async () => {
      expect(wrapper.find(components.test.DivContainer)).to.have.lengthOf(3);
      expect(wrapper.find(components.test.PContainer)).to.have.lengthOf(4);
      const expectedHTML =
        "<div>foo:bar<div>demo-element-2</div><div>hello<p>foo:bar.baz.0.name</p><p>foo:bar.baz.0.age</p><p>foo:bar.baz.1.name</p><p>foo:bar.baz.1.age</p></div></div>";
      expect(wrapper.html()).to.equal(expectedHTML);
    });

    it("should hide the component whose visible state is false", async () => {
      // update visible to false
      expect(uiNode.stateNode.getState("visible")).to.equal(true);
      let childNode = uiNode.getChildren([0]);
      await childNode.dataNode.updateData("Zuoping");
      expect(childNode.dataNode.getData()).to.equal("Zuoping");
      expect(childNode.stateNode.getState("visible")).to.equal(true);
      childNode = uiNode.getChildren([1]);
      expect(childNode.stateNode.getState("visible")).to.equal(false);
      // sub children visible
      childNode = uiNode.getChildren([2]);
      expect(childNode.stateNode.getState("visible")).to.equal(true);
      let expected = "<div>foo:bar<div>demo-element-2</div><div></div></div>";
      expect(wrapper.html()).to.equal(expected);

      // update back to all visible as true
      childNode = uiNode.getChildren([0]);
      await childNode.dataNode.updateData("Zp");
      expect(childNode.stateNode.getState("visible")).to.equal(true);
      childNode = uiNode.getChildren([1]);
      expect(childNode.stateNode.getState("visible")).to.equal(true);
      childNode = uiNode.getChildren([2]);
      expect(childNode.stateNode.getState("visible")).to.equal(false);
      expected =
        "<div>foo:bar<div>demo-element-2</div><div>hello<p>foo:bar.baz.0.name</p><p>foo:bar.baz.0.age</p><p>foo:bar.baz.1.name</p><p>foo:bar.baz.1.age</p></div></div>";
      expect(wrapper.html()).to.equal(expected);
    });

    it("should show componentWrapper from config", async () => {
      wrapper = mount(
        <ComponentWrapper
          uiNode={uiNode}
          key="test"
          config={{ widgetConfig }}
        />
      );
      const expectedHTML =
        "<div><div>foo:bar<div><div>demo-element-2</div></div><div><div>hello<div><div><p>foo:bar.baz.0.name</p></div><div><p>foo:bar.baz.0.age</p></div></div><div><div><p>foo:bar.baz.1.name</p></div><div><p>foo:bar.baz.1.age</p></div></div></div></div></div></div>";
      expect(wrapper.html()).to.equal(expectedHTML);
    });
  });
});
