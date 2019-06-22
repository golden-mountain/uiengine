/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { UINode, Request } from "../../../src";
// import reqConfig from "./config/request";
import stateNodeBasicLayout from "../../layouts/state-node-basic.json";
import reqConfig from "../../config/request";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;

describe("Given all the default plugins", () => {
  before(() => {});
  describe("the given plugins ", () => {
    it("valid should be caculated on the first initial", async () => {});

    it("valid should be caculated on the when update the schema", async () => {});
  });
});
