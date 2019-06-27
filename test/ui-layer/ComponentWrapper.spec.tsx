/* global describe, it, before */
import React, { useState } from "react";

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import { mount } from "enzyme";

import {
  UIEngineRegister,
  ComponentWrapper,
  UINode,
  Request
} from "../../src/";
import reactComponentTestJson from "../layouts/react-component-test.json";
import reqConfig from "../config/request";

// import components
import components from "../components";

chai.use(chaiSpies);
const expect = chai.expect;
const request = new Request(reqConfig);

//  assign elements
let uiNode: any, schema: any, wrapper: any;
// https://airbnb.io/enzyme/docs/api/ShallowWrapper/html.html
describe("Given an instance of ComponentWrapper library", () => {
  before(async () => {
    UIEngineRegister.registerComponents(components);

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
      expect(wrapper.find(components.DivContainer)).to.have.lengthOf(3);
      expect(wrapper.find(components.PContainer)).to.have.lengthOf(4);
      const expectedHTML =
        "<div>foo:bar<div>demo-element-2</div><div>hello<p>foo:bar.baz.0.name</p><p>foo:bar.baz.0.age</p><p>foo:bar.baz.1.name</p><p>foo:bar.baz.1.age</p></div></div>";
      expect(wrapper.html()).to.equal(expectedHTML);
    });

    it("should hide the component whose visible state is false", async () => {
      // update visible to false
      await uiNode.dataNode.updateData("Zuoping", "name");
      expect(uiNode.dataNode.getData("name")).to.equal("Zuoping");
      expect(uiNode.stateNode.getState("visible")).to.equal(true);
      let childNode = uiNode.getChildren([0]);
      expect(childNode.stateNode.getState("visible")).to.equal(true);
      childNode = uiNode.getChildren([1]);
      expect(childNode.stateNode.getState("visible")).to.equal(false);
      let expected = "<div>foo:bar<div>demo-element-2</div></div>";
      expect(wrapper.html()).to.equal(expected);

      // update back to all visible as true
      await uiNode.dataNode.updateData("Zp", "name");
      childNode = uiNode.getChildren([0]);
      expect(childNode.stateNode.getState("visible")).to.equal(true);
      childNode = uiNode.getChildren([1]);
      expect(childNode.stateNode.getState("visible")).to.equal(true);
      expected =
        "<div>foo:bar<div>demo-element-2</div><div>hello<p>foo:bar.baz.0.name</p><p>foo:bar.baz.0.age</p><p>foo:bar.baz.1.name</p><p>foo:bar.baz.1.age</p></div></div>";
      expect(wrapper.html()).to.equal(expected);
    });
  });
});
