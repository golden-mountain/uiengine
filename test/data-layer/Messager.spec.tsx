/* global describe, it, before */
import React, { useState } from "react";

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
import { shallow } from "enzyme";

import { Messager } from "../../src";

chai.use(chaiSpies);
const expect = chai.expect;
const id = "any-id";

describe("Given an instance of my DataNode library", () => {
  before(() => {});
  describe("the given data", () => {
    it("constructor: should created a messager", () => {});
    it("setState: should set the components state", () => {
      const messager = new Messager();
      const MessageUIComponent = (props: any) => {
        const [data, setData] = useState({ value: "foo" });
        console.log(data);
        messager.setStateFunc(id, setData);
        return <div>{data.value}</div>;
      };

      const wrapper = shallow(<MessageUIComponent />);

      // component well created
      let expectedContainedDiv = <div>foo</div>;
      let actualValue = wrapper.contains(expectedContainedDiv);
      expect(actualValue).to.equal(true);

      // messager test
      messager.sendMessage(id, { value: "new foo" });
      expectedContainedDiv = <div>new foo</div>;
      actualValue = wrapper.contains(expectedContainedDiv);
      expect(actualValue).to.equal(true);
    });

    it("removeStateFunc: should remove a func from messager", () => {
      const messager = new Messager();
      messager.removeStateFunc(id);
      expect(Messager.objectStateFuncMap).to.have.not.property(id);
    });
  });
});
