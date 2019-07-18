/* global describe, it, before */
import React, { useState } from "react";

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import { mount } from "enzyme";

import { UIEngineRegister, UIEngine, NodeController } from "../../src/";

import reactComponentTestJson from "../layouts/react-component-test.json";
import reqConfig from "../config/request";

// import components
import components from "../components";

chai.use(chaiSpies);
const expect = chai.expect;

describe("Given an instance of UIEngine library", () => {
  before(() => {
    UIEngineRegister.registerComponents(components);
  });

  describe("the given layouts", () => {
    it("should follow the layout schema, render the UI", async () => {
      const nodeController = NodeController.getInstance();
      nodeController.setRequestConfig(reqConfig);
      const layoutPath = "layouts/react-component-test-2.json";
      const layouts = [reactComponentTestJson, layoutPath];

      // spy loadUINode
      const component = <UIEngine layouts={layouts} reqConfig={reqConfig} />;
      const loadUINodeSpy = chai.spy.on(nodeController, "loadUINode");
      let wrapper = mount(component);
      expect(loadUINodeSpy).to.be.called.twice;
    });
  });
});
