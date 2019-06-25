/* global describe, it, before */
import React, { useState } from "react";

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";
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
        return <div>aaa</div>;
      };
      console.log("test");
    });
  });
});
