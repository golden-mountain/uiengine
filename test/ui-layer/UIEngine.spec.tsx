/* global describe, it, before */
import React, { useState } from "react";

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import { mount } from "enzyme";

import { UIEngineRegister, UIEngine } from "../../src/";

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
      const layoutPath = "layouts/react-component-test-2.json";
      const layouts = [reactComponentTestJson, layoutPath];
      let wrapper: any;
      const testFunc = (nodes: any) => {
        nodes.then((node: any) => {
          wrapper.update();
          expect(wrapper.html()).to.not.empty;
          // expect(wrapper.find(ComponentWrapper)).to.have.lengthOf(2);
        });
      };
      const component = (
        <UIEngine layouts={layouts} reqConfig={reqConfig} test={testFunc} />
      );
      wrapper = mount(component);
    });
  });
});
