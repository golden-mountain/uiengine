/* global describe, it, before */
import chai from "chai";
import engine from "../../../src/helpers/APIEngine";
import * as plugins from "../../../src/plugins";

const expect = chai.expect;

describe("Given an instance of Register's plugin apis library", () => {
  before(() => {});
  describe("the given response ", () => {
    it("get:should same as json file state-test.json", () => {
      // register plugin
      engine.register.plugin.set(plugins);
      engine.register.plugin(plugins);
      engine.register.plugin.get("xxxx");

      // engine.ui({ name: "1234" });
      // engine.ui.layout("1234");
    });
  });
});
