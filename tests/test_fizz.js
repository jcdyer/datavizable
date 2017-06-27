const fizz = require("../dist/fizz.js");
const assert = require("assert");
const DOMParser = require("xmldom").DOMParser;

describe("simpledrawObj", function() {
  describe("constructor", function() {
    it("can be created with a dom object", function() {
      var doc = new DOMParser().parseFromString("<svg></svg>");
      var sd = new fizz.simpledrawObj(doc);
    })
  })
})
