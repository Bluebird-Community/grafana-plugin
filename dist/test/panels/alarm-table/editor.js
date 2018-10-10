'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TablePanelEditorCtrl = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.tablePanelEditor = tablePanelEditor;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _angular = require('angular');

var _angular2 = _interopRequireDefault(_angular);

var _transformers = require('./transformers');

var _kbn = require('app/core/utils/kbn');

var _kbn2 = _interopRequireDefault(_kbn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TablePanelEditorCtrl = exports.TablePanelEditorCtrl = function () {
  /** @ngInject */
  function TablePanelEditorCtrl($scope, $q, uiSegmentSrv) {
    _classCallCheck(this, TablePanelEditorCtrl);

    this.$q = $q;
    this.uiSegmentSrv = uiSegmentSrv;
    $scope.editor = this;
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    this.transformers = _transformers.transformers;
    this.fontSizes = ['80%', '90%', '100%', '110%', '120%', '130%', '150%', '160%', '180%', '200%', '220%', '250%'];

    if (this.panel.severity === true) {
      this.panel.severity = 'row';
    }

    this.addColumnSegment = uiSegmentSrv.newPlusButton();
  }

  _createClass(TablePanelEditorCtrl, [{
    key: 'getColumnOptions',
    value: function getColumnOptions() {
      var _this = this;

      if (!this.panelCtrl.dataRaw) {
        return this.$q.when([]);
      }
      var columns = this.transformers[this.panel.transform].getColumns(this.panelCtrl.dataRaw);
      // Filter out columns that have already been selected
      var self = this;
      columns = columns.filter(function (a) {
        return self.panel.columns.indexOf(a) < 0;
      });
      var segments = _lodash2.default.map(columns, function (c) {
        return _this.uiSegmentSrv.newSegment({ value: c.text });
      });
      return this.$q.when(segments);
    }
  }, {
    key: 'addColumn',
    value: function addColumn() {
      var columns = _transformers.transformers[this.panel.transform].getColumns(this.panelCtrl.dataRaw);
      var column = _lodash2.default.find(columns, { text: this.addColumnSegment.value });

      if (column) {
        this.panel.columns.push(column);
        this.render();
      }

      var plusButton = this.uiSegmentSrv.newPlusButton();
      this.addColumnSegment.html = plusButton.html;
      this.addColumnSegment.value = plusButton.value;
    }
  }, {
    key: 'transformChanged',
    value: function transformChanged() {
      this.panel.columns = [];
      if (this.panel.transform === 'timeseries_aggregations') {
        this.panel.columns.push({ text: 'Avg', value: 'avg' });
      }

      this.render();
    }
  }, {
    key: 'render',
    value: function render() {
      this.panelCtrl.render();
    }
  }, {
    key: 'removeColumn',
    value: function removeColumn(column) {
      this.panel.columns = _lodash2.default.without(this.panel.columns, column);
      this.panelCtrl.render();
    }
  }]);

  return TablePanelEditorCtrl;
}();

/** @ngInject */


function tablePanelEditor($q, uiSegmentSrv) {
  'use strict';

  return {
    restrict: 'E',
    scope: true,
    templateUrl: '/public/plugins/opennms-helm-app/panels/alarm-table/editor.html',
    controller: TablePanelEditorCtrl
  };
}
//# sourceMappingURL=editor.js.map
