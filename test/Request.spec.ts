/* global describe, it, before */

import chai from "chai";
import reqConfig from "./config/request";
import { Request } from "../src";
import stateTestJSON from "./layouts/state-test.json";

const expect = chai.expect;

let request: any;

describe("Given an instance of Request library", () => {
  before(() => {
    request = new Request(reqConfig);
  });
  describe("the given response ", () => {
    it("should same as json file state-test.json", () => {
      const reqData = request.get("layouts/state-test.json");
      // console.log(reqData);
      reqData
        .then((v: any) => {
          // console.log(v.data, "<<<<<<<<<< value", stateTestJSON);
          expect(v.data).to.deep.equal(stateTestJSON);
        })
        .catch(function(error: any) {
          // console.log("Error " + error.message);
        });
    });

    // it("should same as constructor param", () => {
    //   // expect(uiNode.schema).to.be.equal(uinodeLayout);
    //   expect(uiNode.getSchema()).to.deep.equal(uiNodeLayout);
    // });
  });
});
