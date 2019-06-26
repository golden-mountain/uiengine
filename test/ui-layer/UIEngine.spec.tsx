/* global describe, it, before */
import React, { useState } from "react";

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import { shallow } from "enzyme";

import { UIEngineRegister, UIEngine, ComponentWrapper } from "../../src/";

// import components
import components from "../components";

chai.use(chaiSpies);
const expect = chai.expect;

describe("Given an instance of UIEngine library", () => {
  before(() => {
    UIEngineRegister.registerComponents(components);
  });

  describe("the given layouts", () => {
    it("should follow the layout schema, render the UI", () => {});
  });
});
