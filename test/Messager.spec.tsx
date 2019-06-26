/* global describe, it, before */
import React, { useState } from "react";

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import { shallow } from "enzyme";

import { Messager } from "../src";

chai.use(chaiSpies);
const expect = chai.expect;

describe("Given an instance of my DataNode library", () => {
  before(() => {});
  describe("the given data", () => {
    it("constructor: should created a messager", () => {});
    it("setState: should set the components state", () => {
      const messager = new Messager();
      const MessageUIComponent = (props: any) => {
        const [data, setData] = useState("foo");
        messager.setStateFunc(setData);
        return <div>{data}</div>;
      };

      const wrapper = shallow(<MessageUIComponent />);

      // component well created
      let expectedContainedDiv = <div>foo</div>;
      let actualValue = wrapper.contains(expectedContainedDiv);
      expect(actualValue).to.equal(true);

      // messager test
      messager.sendMessage("new foo");
      expectedContainedDiv = <div>new foo</div>;
      actualValue = wrapper.contains(expectedContainedDiv);
      expect(actualValue).to.equal(true);
    });

    it("removeStateFunc: should remove a func from messager", () => {
      const messager = new Messager();
      messager.removeStateFunc();
      expect(messager.caller).to.be.null;
    });
  });
});
