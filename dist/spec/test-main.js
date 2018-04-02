'use strict';

System.register(['prunk', 'jsdom', 'chai'], function (_export, _context) {
  "use strict";

  var prunk, jsdom, chai, JSDOM, dom;
  return {
    setters: [function (_prunk) {
      prunk = _prunk.default;
    }, function (_jsdom) {
      jsdom = _jsdom.default;
    }, function (_chai) {
      chai = _chai.default;
    }],
    execute: function () {
      JSDOM = jsdom.JSDOM;


      // Mock Grafana modules that are not available outside of the core project
      // Required for loading module.js
      prunk.mock('./css/query-editor.css!', 'no css, dude.');
      prunk.mock('app/plugins/sdk', {
        QueryCtrl: null,
        loadPluginCss: function loadPluginCss() {}
      });

      // Setup jsdom
      // Required for loading angularjs
      dom = new JSDOM('<html><head><script></script></head><body></body></html>');

      global.window = dom.window;

      // Setup Chai
      chai.should();
      global.assert = chai.assert;
      global.expect = chai.expect;
    }
  };
});
//# sourceMappingURL=test-main.js.map
