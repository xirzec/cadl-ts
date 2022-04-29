// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { describe } from "mocha";
import { assert } from "chai";

import { nameToIdentifier } from "../src/util/naming.js";

describe("naming.ts", function () {
  describe("nameToIdentifier", function () {
    it("should not modify valid names", function () {
      assert.strictEqual(nameToIdentifier("foo"), "foo");
    });

    it("should handle kebab case names", function () {
      assert.strictEqual(nameToIdentifier("foo-bar-baz"), "fooBarBaz");
    });

    it("should handle snake case names", function () {
      assert.strictEqual(nameToIdentifier("foo_bar_baz"), "fooBarBaz");
    });

    it("should handle pascal case names", function () {
      assert.strictEqual(nameToIdentifier("SomeName"), "someName");
    });

    it("should normalize casing", function () {
      assert.strictEqual(nameToIdentifier("ALL_UPPER"), "allUpper");
    });

    it("should normalize casing without separators", function () {
      assert.strictEqual(nameToIdentifier("HELLO"), "hello");
    });

    it("remove invalid characters", function () {
      assert.strictEqual(nameToIdentifier("foo^bar"), "foobar");
    });

    it("fix first character being a number", function () {
      assert.strictEqual(nameToIdentifier("1fear"), "$1fear");
    });
  });
});
