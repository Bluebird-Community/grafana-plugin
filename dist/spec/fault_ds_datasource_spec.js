'use strict';

System.register(['q', 'lodash', 'moment', '../datasources/fault-ds/UI', '../opennms', '../datasources/fault-ds/Mapping', '../datasources/fault-ds/FilterCloner', '../datasources/fault-ds/datasource', '../lib/client_delegate', './template_srv'], function (_export, _context) {
    "use strict";

    var Q, _, moment, UI, API, Mapping, FilterCloner, Datasource, ClientDelegate, TemplateSrv;

    return {
        setters: [function (_q) {
            Q = _q.default;
        }, function (_lodash) {
            _ = _lodash.default;
        }, function (_moment) {
            moment = _moment.default;
        }, function (_datasourcesFaultDsUI) {
            UI = _datasourcesFaultDsUI.UI;
        }, function (_opennms) {
            API = _opennms.API;
        }, function (_datasourcesFaultDsMapping) {
            Mapping = _datasourcesFaultDsMapping.Mapping;
        }, function (_datasourcesFaultDsFilterCloner) {
            FilterCloner = _datasourcesFaultDsFilterCloner.FilterCloner;
        }, function (_datasourcesFaultDsDatasource) {
            Datasource = _datasourcesFaultDsDatasource.OpenNMSFMDatasource;
        }, function (_libClient_delegate) {
            ClientDelegate = _libClient_delegate.ClientDelegate;
        }, function (_template_srv) {
            TemplateSrv = _template_srv.TemplateSrv;
        }],
        execute: function () {

            describe("OpenNMS_FaultManagement_Datasource", function () {
                var uiSegmentSrv = {
                    newSegment: function newSegment(value, type) {
                        return { value: value, type: type };
                    },
                    newKey: function newKey(key) {
                        return this.newSegment(key, 'key');
                    },
                    newOperator: function newOperator(operator) {
                        return this.newSegment(operator, 'operator');
                    },
                    newFake: function newFake(text, type, cssClass) {
                        var segment = this.newSegment(text, type);
                        segment.fake = true;
                        return segment;
                    },
                    newPlusButton: function newPlusButton() {
                        return this.newFake('', 'plus-button');
                    },
                    newKeyValue: function newKeyValue(value) {
                        return this.newSegment(value, 'value');
                    },
                    newCondition: function newCondition(condition) {
                        return this.newSegment(condition, 'condition');
                    }
                };

                describe('Mapping', function () {
                    describe('ComparatorMapping', function () {
                        var mapping = new Mapping.ComparatorMapping();

                        it("should map from api to ui comparator", function (done) {
                            expect(mapping.getUiComparator(API.Comparators.EQ)).to.eql("=");
                            expect(mapping.getUiComparator(API.Comparators.NE)).to.eql("!=");
                            expect(mapping.getUiComparator(API.Comparators.GE)).to.eql(">=");
                            expect(mapping.getUiComparator(API.Comparators.LE)).to.eql("<=");
                            expect(mapping.getUiComparator(API.Comparators.GT)).to.eql(">");
                            expect(mapping.getUiComparator(API.Comparators.LT)).to.eql("<");

                            done();
                        });

                        it("should NOT map from api to ui comparator", function (done) {
                            expect(function () {
                                return mapping.getUiComparator(API.Comparators.NULL);
                            }).to.throw("No matching UI comparator found for '" + API.Comparators.NULL.label + "'.");
                            expect(function () {
                                return mapping.getUiComparator(API.Comparators.NOTNULL);
                            }).to.throw("No matching UI comparator found for '" + API.Comparators.NOTNULL.label + "'.");
                            expect(function () {
                                return mapping.getUiComparator(API.Comparators.LIKE);
                            }).to.throw("No matching UI comparator found for '" + API.Comparators.LIKE.label + "'.");
                            expect(function () {
                                return mapping.getUiComparator(API.Comparators.ILIKE);
                            }).to.throw("No matching UI comparator found for '" + API.Comparators.ILIKE.label + "'.");

                            done();
                        });

                        it("should map from ui to api comparator", function (done) {
                            expect(mapping.getApiComparator(UI.Comparators.EQ)).to.eql(API.Comparators.EQ);
                            expect(mapping.getApiComparator(UI.Comparators.NEQ)).to.eql(API.Comparators.NE);
                            expect(mapping.getApiComparator(UI.Comparators.GE)).to.eql(API.Comparators.GE);
                            expect(mapping.getApiComparator(UI.Comparators.LE)).to.eql(API.Comparators.LE);
                            expect(mapping.getApiComparator(UI.Comparators.GT)).to.eql(API.Comparators.GT);
                            expect(mapping.getApiComparator(UI.Comparators.LT)).to.eql(API.Comparators.LT);

                            done();
                        });
                    });

                    describe('OperatorMapping', function () {
                        var mapping = new Mapping.OperatorMapping();

                        it("should map from api to ui operator", function (done) {
                            expect(mapping.getUiOperator(API.Operators.AND)).to.eql("AND");
                            expect(mapping.getUiOperator(API.Operators.OR)).to.eql("OR");

                            done();
                        });

                        it("should map from ui to api operator", function (done) {
                            expect(mapping.getApiOperator(UI.Operators.AND)).to.eql(API.Operators.AND);
                            expect(mapping.getApiOperator(UI.Operators.OR)).to.eql(API.Operators.OR);

                            done();
                        });
                    });

                    describe('RestrictionMapping', function () {
                        var mapping = new Mapping.RestrictionMapping(uiSegmentSrv);

                        it("should map from api restriction", function (done) {
                            expect(mapping.getUiRestriction(new API.Restriction("my-property", API.Comparators.LE, 'some-value'))).to.eql(new UI.Restriction(uiSegmentSrv, new UI.RestrictionDTO('my-property', '<=', 'some-value')));
                            done();
                        });

                        it("should map from api nested restriction", function (done) {
                            var nestedRestriction = new API.NestedRestriction().withOrRestriction(new API.Restriction("my-property", API.Comparators.LE, 'some-value')).withOrRestriction(new API.Restriction("my-property", API.Comparators.GE, 'some-other-value'));

                            var actualUiQuery = mapping.getUiRestriction(nestedRestriction);

                            var expectedUiQuery = new UI.Query(uiSegmentSrv);
                            expectedUiQuery.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.OR, new UI.Restriction(uiSegmentSrv, new UI.RestrictionDTO("my-property", "<=", "some-value"))));
                            expectedUiQuery.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.OR, new UI.Restriction(uiSegmentSrv, new UI.RestrictionDTO("my-property", ">=", "some-other-value"))));

                            expect(actualUiQuery).to.eql(expectedUiQuery);

                            done();
                        });
                    });

                    describe('ClauseMapping', function () {
                        var mapping = new Mapping.ClauseMapping(uiSegmentSrv);

                        it('should ignore not initialized clauses (restrictionDTO is null)', function (done) {

                            var clause = new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.Restriction(this.uiSegmentSrv));
                            expect(mapping.getApiClause(clause)).to.eql(null);

                            done();
                        });
                    });

                    describe('FilterMapping', function () {

                        var mapping = new Mapping.FilterMapping(uiSegmentSrv);

                        it('should map from empty ui to api filter', function (done) {
                            var apiFilter = new API.Filter();
                            apiFilter.limit = 0;
                            expect(mapping.getApiFilter(new UI.Filter(uiSegmentSrv))).to.eql(apiFilter);

                            done();
                        });

                        it('should map from api to ui filter and vice versa', function (done) {
                            var apiFilter = new API.Filter().withClause(new API.Clause(new API.Restriction("key", API.Comparators.EQ, "value"), API.Operators.OR)).withClause(new API.Clause(new API.Restriction("key2", API.Comparators.NE, "value2"), API.Operators.AND));
                            apiFilter.limit = 0;

                            var uiFilter = new UI.Filter(uiSegmentSrv).withClause(new UI.Clause(uiSegmentSrv, UI.Operators.OR, new UI.RestrictionDTO("key", "=", "value"))).withClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO("key2", "!=", "value2")));

                            expect(mapping.getUiFilter(apiFilter)).to.eql(uiFilter);
                            expect(mapping.getApiFilter(uiFilter)).to.eql(apiFilter);

                            done();
                        });

                        it('should map from api to ui filter with nested restrictions when serialized and deserialized again', function () {
                            // Create the filter
                            var apiFilter = new API.Filter().withClause(new API.Clause(new API.Restriction("alarmAckUser", API.Comparators.EQ, "Administrator"), API.Operators.AND)).withClause(new API.Clause(new API.NestedRestriction().withClause(new API.Clause(new API.Restriction("severity", API.Comparators.GE, "WARNING"), API.Operators.AND)), API.Operators.AND));

                            // Simulate persisting and reloading
                            var serialized = JSON.stringify(apiFilter);
                            var deserialized = JSON.parse(serialized);
                            var cloned = new FilterCloner().cloneFilter(deserialized);

                            // Now try to map it to an ui filter
                            var uiFilter = mapping.getUiFilter(cloned);
                            expect(uiFilter.getQueryString()).to.eql("select all alarms where alarmAckUser = 'Administrator' and (severity >= 'WARNING')");
                        });
                    });
                });

                describe('FilterCloner', function () {

                    var apiFilter = new API.Filter().withClause(new API.Clause(new API.Restriction('key', API.Comparators.EQ, 'value'), API.Operators.AND)).withClause(new API.Clause(new API.Restriction('key2', API.Comparators.EQ, 'value2'), API.Operators.AND)).withClause(new API.Clause(new API.NestedRestriction().withClause(new API.Clause(new API.Restriction("key3", API.Comparators.NE, "value3"), API.Operators.OR)), API.Operators.AND));

                    it('should clone already initialized', function (done) {
                        var otherFilter = new FilterCloner().cloneFilter(apiFilter);
                        expect(apiFilter).to.eql(otherFilter);

                        done();
                    });

                    it('should clone', function (done) {
                        var jsonString = JSON.stringify(apiFilter);
                        var object = JSON.parse(jsonString);
                        expect(object).not.to.be.an.instanceof(API.Filter);

                        var filterObject = new FilterCloner().cloneFilter(object);
                        expect(filterObject).to.be.an.instanceof(API.Filter);
                        expect(apiFilter).to.eql(filterObject);

                        done();
                    });
                });

                describe("UI.Restriction", function () {
                    // See HELM-25
                    it('should only convert to DTO when fully defined', function () {
                        // Should be null when not initialized
                        var restriction = new UI.Restriction(uiSegmentSrv);
                        expect(restriction.asRestrictionDTO()).to.eql(null);

                        // Should be null when initialized with defaults
                        restriction.setAttribute(UI.Restriction.KEY_PLACEHOLDER);
                        restriction.setComparator("=");
                        restriction.setValue(UI.Restriction.VALUE_PLACEHOLDER);

                        // Should be null for all other Comparators
                        Object.keys(UI.Comparators).forEach(function (key) {
                            restriction.setComparator(UI.Comparators[key]);
                            expect(restriction.asRestrictionDTO()).to.eql(null);
                        });

                        // Should be null if value is set
                        restriction.setValue("my value");
                        expect(restriction.asRestrictionDTO()).to.eql(null);

                        // Should be null if attribute is set
                        restriction.setValue(UI.Restriction.VALUE_PLACEHOLDER);
                        restriction.setAttribute("my attribute");
                        expect(restriction.asRestrictionDTO()).to.eql(null);

                        // should not be null if attribute and value is set
                        restriction.setAttribute("my attribute");
                        restriction.setComparator("=");
                        restriction.setValue("my value");
                        expect(restriction.asRestrictionDTO()).not.to.eql(null);
                        expect(restriction.asRestrictionDTO()).to.eql(new UI.RestrictionDTO("my attribute", "=", "my value"));
                    });
                });

                describe("UI.Query", function () {
                    var query = void 0;

                    beforeEach(function () {
                        query = new UI.Filter(uiSegmentSrv).query;
                    });

                    it('should add new empty clause', function (done) {
                        expect(query.clauses.length).to.eql(0);
                        query.createNewEmptyClause();
                        expect(query.clauses.length).to.eql(1);

                        done();
                    });

                    it('should add new empty nested clause', function (done) {

                        expect(query.clauses.length).to.eql(0);
                        query.createNewEmptyNestedClause();
                        expect(query.clauses.length).to.eql(1);

                        expect(query.clauses[0].restriction.clauses.length).to.eql(1);

                        done();
                    });
                });

                describe("UI.Controls", function () {

                    var uiFilter = void 0;

                    beforeEach(function () {
                        uiFilter = new UI.Filter(uiSegmentSrv);
                    });

                    describe('AddControl', function () {
                        var control = new UI.Controls.AddControl();

                        describe("filter", function () {
                            it('always show, except for nested controls', function (done) {
                                expect(control.filter(uiFilter.query, new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.Restriction(uiSegmentSrv)))).to.eql(true);

                                expect(control.filter(uiFilter.query, new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.Query(uiSegmentSrv)))).to.eql(false);

                                done();
                            });
                        });

                        describe("action", function () {

                            it('should add new empty clause', function (done) {
                                var newClause = uiFilter.query.createNewEmptyClause();
                                expect(uiFilter.query.clauses.length).to.eql(1);

                                control.action(uiFilter.query, newClause);
                                expect(uiFilter.query.clauses.length).to.eql(2);

                                done();
                            });
                        });
                    });

                    describe('RemoveControl', function () {

                        var control = new UI.Controls.RemoveControl();

                        describe("filter", function () {
                            it('do not show on first empty clause', function (done) {
                                uiFilter.query.createNewEmptyClause();

                                expect(control.filter(uiFilter.query, uiFilter.query.clauses[0])).to.eql(false);

                                done();
                            });

                            it('show on nested and children of nested clause', function (done) {

                                uiFilter.query.createNewEmptyNestedClause();

                                expect(uiFilter.query.clauses.length).to.eql(1);
                                expect(control.filter(uiFilter.query, uiFilter.query.clauses[0])).to.eql(false); // no control on nested clause
                                expect(control.filter(uiFilter.query.clauses[0].restriction, uiFilter.query.clauses[0].restriction.clauses[0])).to.eql(true); // control on clause

                                done();
                            });

                            it('show on other clauses', function (done) {
                                uiFilter.query.createNewEmptyClause();
                                uiFilter.query.createNewEmptyClause();

                                _.each(uiFilter.query.clauses, function (clause) {
                                    expect(control.filter(uiFilter.query, clause)).to.eql(true);
                                });

                                done();
                            });
                        });

                        describe("action", function () {
                            it('should remove clause', function (done) {
                                // add dummy clause
                                uiFilter.query.createNewEmptyClause();
                                expect(uiFilter.query.clauses.length).to.eql(1);

                                // perform action
                                control.action(uiFilter.query, uiFilter.query.clauses[0]);

                                // verify it was removed
                                expect(uiFilter.query.clauses.length).to.eql(0);

                                done();
                            });

                            it('should remove query from parent clause if last clause was removed', function (done) {
                                // dummy clause added yet
                                uiFilter.query.createNewEmptyClause();
                                expect(uiFilter.query.clauses.length).to.eql(1);

                                // add nested clause
                                var newQuery = uiFilter.query.createNewEmptyNestedClause();
                                expect(uiFilter.query.clauses.length).to.eql(2);
                                expect(newQuery.clauses.length).to.eql(1);

                                // perform action ...
                                control.action(newQuery, newQuery.clauses[0]);

                                // ... and verify that it was removed
                                expect(newQuery.clauses.length).to.eql(0);
                                expect(uiFilter.query.clauses.length).to.eql(1);

                                done();
                            });
                        });
                    });

                    describe('NestedControl', function () {
                        var control = new UI.Controls.AddNestedControl();

                        describe("filter", function () {
                            it('show on all 1st level clauses, except nested clause', function (done) {
                                uiFilter.query.createNewEmptyClause();
                                uiFilter.query.createNewEmptyClause();
                                uiFilter.query.createNewEmptyClause();

                                _.each(uiFilter.query.clauses, function (clause) {
                                    expect(control.filter(uiFilter.query, clause)).to.eql(true);
                                });

                                // Try nested
                                uiFilter.query.createNewEmptyNestedClause();
                                expect(control.filter(uiFilter.query, uiFilter.query.clauses[3])).to.eql(false);

                                done();
                            });

                            it('do not show on 2nd level clauses ', function (done) {
                                uiFilter.query.createNewEmptyNestedClause();
                                uiFilter.query.createNewEmptyClause();

                                var newQuery = uiFilter.query.clauses[0].restriction;
                                newQuery.createNewEmptyClause();
                                newQuery.createNewEmptyClause();
                                newQuery.createNewEmptyClause();

                                // verify 2nd level
                                _.each(newQuery.clauses, function (clause) {
                                    expect(control.filter(newQuery, clause)).to.eql(false);
                                });

                                // verify 1st level
                                expect(control.filter(uiFilter.query, uiFilter.query.clauses[0])).to.eql(false);
                                expect(control.filter(uiFilter.query, uiFilter.query.clauses[1])).to.eql(true);

                                done();
                            });
                        });
                    });
                });

                describe('UI.Filter', function () {
                    var uiFilter = void 0;

                    beforeEach(function () {
                        uiFilter = new UI.Filter(uiSegmentSrv);
                    });

                    describe('addClause', function () {
                        it('should allow adding a single restriction', function (done) {
                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO("severity", UI.Comparators.EQ, 'CLEARED')));
                            expect(uiFilter.query.clauses).to.have.lengthOf(1);
                            expect(uiFilter.query.clauses[0].restriction.segments).to.have.lengthOf(3);
                            expect(uiFilter.query.clauses[0].restriction.segments[0].value).to.eql('severity');
                            expect(uiFilter.query.clauses[0].restriction.segments[1].value).to.eql("=");
                            expect(uiFilter.query.clauses[0].restriction.segments[2].value).to.eql('CLEARED');
                            expect(uiFilter.query.clauses[0].operator.value).to.eql("AND");

                            done();
                        });

                        it('should fail when unsupported type', function (done) {

                            expect(function () {
                                return uiFilter.addClause("string");
                            }).to.throw("Clause type is not supported");

                            done();
                        });
                    });

                    describe('removeClause', function () {
                        var clause = new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO("key", "=", "value"));

                        it("should not remove non existing clause", function (done) {
                            expect(uiFilter.query.clauses).to.have.lengthOf(0);
                            uiFilter.withClause(clause);
                            uiFilter.removeClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO("x", "=", "0")));
                            expect(uiFilter.query.clauses).to.have.lengthOf(1);

                            done();
                        });

                        it("should remove existing clause", function (done) {
                            expect(uiFilter.query.clauses).to.have.lengthOf(0);
                            uiFilter.withClause(clause);
                            expect(uiFilter.query.clauses).to.have.lengthOf(1);
                            uiFilter.removeClause(clause);
                            expect(uiFilter.query.clauses).to.have.lengthOf(0);

                            done();
                        });
                    });

                    describe('clear', function () {
                        it('should reset query', function (done) {
                            uiFilter.query.root = false; // make it pass
                            expect(uiFilter.query).to.eql(new UI.Query(uiSegmentSrv));

                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO("key", "=", "value")));
                            expect(uiFilter.query).not.to.eql(new UI.Query(uiSegmentSrv));

                            uiFilter.clear();
                            expect(uiFilter.query).to.eql(new UI.Query(uiSegmentSrv));

                            done();
                        });
                    });

                    describe('getQueryString', function () {
                        it('should work with empty clause', function (done) {
                            expect(uiFilter.getQueryString()).to.eql("select all alarms");
                            done();
                        });

                        it('should work with single clause', function (done) {
                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO('severity', UI.Comparators.EQ, 'MINOR')));

                            expect(uiFilter.getQueryString()).to.eql("select all alarms where severity = 'MINOR'");
                            done();
                        });

                        it('should not include not initialized clauses (restrictionDTO is not fully initialized)', function (done) {
                            var expected = "select all alarms where severity >= 'WARNING'";

                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.OR, new UI.RestrictionDTO("severity", UI.Comparators.GE, 'WARNING')));
                            expect(uiFilter.getQueryString()).to.eql(expected);

                            // It does not have any attribute, comparator or value data (valid state), but should not be considered when generating the string
                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.OR, new UI.Restriction(uiSegmentSrv)));
                            expect(uiFilter.getQueryString()).to.eql(expected);

                            done();
                        });

                        it('should handle null values', function (done) {
                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO("location", UI.Comparators.EQ, "null")));
                            expect(uiFilter.getQueryString()).to.eql("select all alarms where location is null");

                            uiFilter.clear();
                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO("location", UI.Comparators.NEQ, "null")));
                            expect(uiFilter.getQueryString()).to.eql("select all alarms where location is not null");

                            done();
                        });

                        it('should work with multiple clauses', function (done) {
                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO('severity', UI.Comparators.EQ, 'MINOR')));
                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.OR, new UI.RestrictionDTO('severity', UI.Comparators.EQ, 'MAJOR')));

                            expect(uiFilter.getQueryString()).to.eql("select all alarms where severity = 'MINOR' or severity = 'MAJOR'");

                            uiFilter.clear();
                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO('severity', UI.Comparators.EQ, 'MINOR')));
                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO('severity', UI.Comparators.EQ, 'MAJOR')));

                            expect(uiFilter.getQueryString()).to.eql("select all alarms where severity = 'MINOR' and severity = 'MAJOR'");

                            done();
                        });

                        it('should work with nested clauses', function (done) {
                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO('location', UI.Comparators.EQ, 'Stuttgart')));
                            uiFilter.addClause(new API.Clause(new API.NestedRestriction().withClause(new API.Clause(new API.Restriction('severity', API.Comparators.GE, 'WARNING'), API.Operators.AND)).withClause(new API.Clause(new API.Restriction('severity', API.Comparators.LE, 'MAJOR'), API.Operators.AND)), API.Operators.OR));
                            expect(uiFilter.getQueryString()).to.eql("select all alarms where location = 'Stuttgart' or (severity >= 'WARNING' and severity <= 'MAJOR')");

                            // let's try the other way around
                            uiFilter.clear();
                            uiFilter.addClause(new API.Clause(new API.NestedRestriction().withClause(new API.Clause(new API.Restriction('severity', API.Comparators.GE, 'WARNING'), API.Operators.AND)).withClause(new API.Clause(new API.Restriction('severity', API.Comparators.LE, 'MAJOR'), API.Operators.AND)), API.Operators.OR));
                            uiFilter.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.RestrictionDTO('location', UI.Comparators.EQ, 'Stuttgart')));
                            expect(uiFilter.getQueryString()).to.eql("select all alarms where (severity >= 'WARNING' and severity <= 'MAJOR') and location = 'Stuttgart'");

                            // let's try 2 nested restrictions
                            uiFilter.clear();
                            uiFilter.addClause(new API.Clause(new API.NestedRestriction().withClause(new API.Clause(new API.Restriction('location', API.Comparators.EQ, 'Stuttgart'), API.Operators.OR)).withClause(new API.Clause(new API.Restriction('location', API.Comparators.EQ, 'Fulda'), API.Operators.OR)), API.Operators.AND));
                            uiFilter.addClause(new API.Clause(new API.NestedRestriction().withClause(new API.Clause(new API.Restriction('severity', API.Comparators.GE, 'WARNING'), API.Operators.AND)).withClause(new API.Clause(new API.Restriction('severity', API.Comparators.LE, 'MAJOR'), API.Operators.AND)), API.Operators.AND));
                            expect(uiFilter.getQueryString()).to.eql("select all alarms where (location = 'Stuttgart' or location = 'Fulda') and (severity >= 'WARNING' and severity <= 'MAJOR')");

                            done();
                        });

                        it('should handle deep nested clauses', function (done) {
                            var nestedRestriction = new API.NestedRestriction().withClause(new API.Clause(new API.Restriction("severity", API.Comparators.GE, 'WARNING'), API.Operators.AND)).withClause(new API.Clause(new API.Restriction("severity", API.Comparators.LE, 'MAJOR'), API.Operators.AND)).withClause(new API.Clause(new API.NestedRestriction().withClause(new API.Clause(new API.Restriction("location", API.Comparators.EQ, "Fulda"), API.Operators.OR)), API.Operators.OR), API.Operators.OR);

                            uiFilter.addClause(new API.Clause(nestedRestriction, API.Operators.OR));

                            expect(uiFilter.getQueryString()).to.eql("select all alarms where (severity >= 'WARNING' and severity <= 'MAJOR' or (location = 'Fulda'))");

                            done();
                        });

                        it('should render real nested clauses correctly', function (done) {
                            // Dummy clause should not influence the query
                            uiFilter.query.createNewEmptyNestedClause();
                            expect(uiFilter.getQueryString()).to.eql("select all alarms");

                            // update the values
                            var query = uiFilter.query.clauses[0].restriction;
                            query.clauses[0].restriction.setAttribute("key");
                            query.clauses[0].restriction.setComparator("=");
                            query.clauses[0].restriction.setValue("value");

                            // should now be influenced
                            expect(uiFilter.getQueryString()).to.eql("select all alarms where (key = 'value')");

                            done();
                        });
                    });

                    describe("updateControls", function () {

                        var verifyNoControls = function verifyNoControls(query) {
                            _.each(query.clauses, function (clause) {
                                expect(clause.controls.length).to.eql(0);
                            });
                        };

                        var verifyFullControls = function verifyFullControls(clause) {
                            verifyControls(clause, [UI.Controls.RemoveControl, UI.Controls.AddControl, UI.Controls.AddNestedControl]);
                        };

                        var verifyControls = function verifyControls(clause) {
                            var controls = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

                            expect(clause.controls.length).to.eql(controls.length); // add, add nested and remove
                            if (controls.length > 0) {
                                _.each(controls, function (control, index) {
                                    expect(clause.controls[index]).to.be.an.instanceof(control);
                                });
                            }
                        };

                        it('should create controls for add and add nested', function (done) {
                            verifyNoControls(uiFilter.query);
                            expect(uiFilter.query.clauses.length).to.eql(0);

                            // Update controls
                            uiFilter.updateControls();
                            expect(uiFilter.query.clauses.length).to.eql(1); // dummy row

                            // now the controls should be there
                            _.each(uiFilter.query.clauses, function (clause) {
                                verifyControls(clause, [UI.Controls.AddControl, UI.Controls.AddNestedControl]);
                            });

                            done();
                        });

                        it('should create controls for add, add nested and remove', function (done) {
                            verifyNoControls(uiFilter.query);

                            uiFilter.query.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.Restriction(uiSegmentSrv, new UI.RestrictionDTO("key", "=", "value"))));
                            uiFilter.updateControls();

                            expect(uiFilter.query.clauses.length).to.eql(1);
                            _.each(uiFilter.query.clauses, function (clause) {
                                verifyFullControls(clause);
                            });

                            done();
                        });

                        it('should not add nested controls on level 2', function (done) {
                            verifyNoControls(uiFilter.query);

                            uiFilter.query.addClause(new UI.Clause(uiSegmentSrv, UI.Operators.AND, new UI.Restriction(uiSegmentSrv, new UI.RestrictionDTO("key", "=", "value"))));
                            uiFilter.query.createNewEmptyNestedClause();
                            uiFilter.updateControls();

                            expect(uiFilter.query.clauses.length).to.eql(2);
                            expect(uiFilter.query.clauses[1].restriction.clauses.length).to.eql(1);
                            verifyFullControls(uiFilter.query.clauses[0]); // all controls on simple clause
                            verifyControls(uiFilter.query.clauses[1], []); // no controls on nested clause
                            verifyControls(uiFilter.query.clauses[1].restriction.clauses[0], [UI.Controls.RemoveControl, UI.Controls.AddControl]); // limited controls on clause of nested clause

                            done();
                        });
                    });
                });

                describe('ClientDelegate', function () {
                    var ctx = {};

                    beforeEach(function () {
                        ctx.backendSrv = {};
                        ctx.$q = Q;
                        ctx.settings = {
                            type: "opennms-fm",
                            name: "dummy-name",
                            url: "http://localhost:8980/opennms"
                        };
                    });

                    it('should not throw an exception when supported version is used', function (done) {
                        // All requests assume the /rest/info call
                        ctx.backendSrv.datasourceRequest = function (request) {
                            return ctx.$q.when({
                                _request: request,
                                status: 200,
                                headers: {
                                    'content-type': 'application/json'
                                },
                                data: { 'packageDescription': 'OpenNMS Meridian', 'displayVersion': '2017.1.0', 'packageName': 'meridian', 'version': '2017.1.0' }
                            });
                        };

                        // Instantiate and try to do any operation on the delegate
                        var delegate = new ClientDelegate(ctx.settings, ctx.backendSrv, ctx.$q);
                        delegate.getClientWithMetadata().then(function (metadata) {
                            done();
                        });
                    });

                    it('should throw exception when unsupported version is used', function (done) {
                        // All requests assume the /rest/info call
                        ctx.backendSrv.datasourceRequest = function (request) {
                            return ctx.$q.when({
                                _request: request,
                                status: 200,
                                headers: {
                                    'content-type': 'application/json'
                                },
                                data: API.OnmsResult.ok({ 'packageDescription': 'OpenNMS', 'displayVersion': '19.1.0', 'packageName': 'opennms', 'version': '19.1.0' })
                            });
                        };

                        // Instantiate and try to do any operation on the delegate
                        var delegate = new ClientDelegate(ctx.settings, ctx.backendSrv, ctx.$q);
                        delegate.getClientWithMetadata().catch(function (err) {
                            expect(err.message).to.eql("Unsupported Version");
                            done();
                        });
                    });
                });

                describe('Datasource', function () {
                    var ctx = {};

                    var defaultSettings = {
                        "type": "opennms-fm",
                        "url": "http://localhost:8980/opennms",
                        "name": "OpenNMS FM Datasource"
                    };

                    var createDatasource = function createDatasource(settings, ctx) {
                        ctx.datasource = new Datasource(settings, ctx.$q, ctx.backendSrv, ctx.templateSrv, ctx.contextSrv);
                        return ctx.datasource;
                    };

                    beforeEach(function () {
                        // Context initialization
                        ctx.$q = Q;
                        ctx.backendSrv = {};
                        ctx.templateSrv = new TemplateSrv();
                        ctx.uiSegmentSrv = uiSegmentSrv;
                        ctx.contextSrv = { user: { login: "admin", email: "admin@opennms.org", name: "The Administrator" } };
                        ctx.range_from = moment();
                        ctx.range_to = ctx.range_from.add(1, 'days');
                        createDatasource(defaultSettings, ctx);
                    });

                    describe('user field', function () {
                        it('should not be instantiated by default', function () {
                            expect(ctx.datasource.user).to.be.undefined;
                        });

                        it('should be ignored if useGrafanaUser is false', function () {
                            var settings = Object.assign({}, defaultSettings);
                            settings.jsonData = {
                                useGrafanaUser: false,
                                grafanaUserField: 'email'
                            };
                            expect(createDatasource(settings, ctx).user).to.be.undefined;
                        });

                        it('should be login if undefined', function () {
                            var settings = Object.assign({}, defaultSettings);
                            settings.jsonData = {
                                useGrafanaUser: true
                            };
                            expect(createDatasource(settings, ctx).user).to.equal("admin");
                        });

                        it('should be login if defined', function () {
                            var settings = Object.assign({}, defaultSettings);
                            settings.jsonData = {
                                useGrafanaUser: true,
                                grafanaUserField: 'login'
                            };
                            expect(createDatasource(settings, ctx).user).to.equal("admin");
                        });

                        it('should be email if defined', function () {
                            var settings = Object.assign({}, defaultSettings);
                            settings.jsonData = {
                                useGrafanaUser: true,
                                grafanaUserField: 'email'
                            };
                            expect(createDatasource(settings, ctx).user).to.equal("admin@opennms.org");
                        });

                        it('should be name if defined', function () {
                            var settings = Object.assign({}, defaultSettings);
                            settings.jsonData = {
                                useGrafanaUser: true,
                                grafanaUserField: 'name'
                            };
                            expect(createDatasource(settings, ctx).user).to.equal("The Administrator");
                        });

                        it('should fall back to login if field does not exist', function () {
                            delete ctx.contextSrv.user.email;
                            var settings = Object.assign({}, defaultSettings);
                            settings.jsonData = {
                                useGrafanaUser: true,
                                grafanaUserField: 'email'
                            };
                            expect(createDatasource(settings, ctx).user).to.equal("admin");
                        });
                    });

                    describe('buildQuery', function () {
                        it('should substitute scoped variables', function () {
                            // The filter with variables
                            var filter = new API.Filter().withClause(new API.Clause(new API.Restriction("key", API.Comparators.EQ, "$variable1"), API.Operators.AND)).withClause(new API.Clause(new API.Restriction("key2", API.Comparators.EQ, "Hello this is my [[variable1]]"), API.Operators.AND)).withClause(new API.Clause(new API.Restriction("key3", API.Comparators.EQ, "value3"), API.Operators.AND));

                            // The scoped variables
                            var options = {
                                scopedVars: {
                                    "variable1": { value: "dummy-value" }
                                }
                            };

                            var substituedFilter = ctx.datasource.buildQuery(filter, options);

                            // Verify
                            expect(substituedFilter.clauses[0].restriction.value).to.equal("dummy-value");
                            expect(substituedFilter.clauses[1].restriction.value).to.equal("Hello this is my dummy-value");
                            expect(substituedFilter.clauses[2].restriction.value).to.equal("value3");
                        });

                        it('should substitude $range_from and $range_to accordingly', function () {
                            // Options
                            var options = {
                                targets: [filter],
                                range: {
                                    from: ctx.range_from,
                                    to: ctx.range_to
                                },
                                scopedVars: {}
                            };

                            // The input filter
                            var filter = new API.Filter().withClause(new API.Clause(new API.Restriction("key", API.Comparators.EQ, "$range_from"), API.Operators.AND)).withClause(new API.Clause(new API.Restriction("key2", API.Comparators.EQ, "$range_to"), API.Operators.AND)).withClause(new API.Clause(new API.Restriction("key3", API.Comparators.EQ, "[[range_from]]"), API.Operators.AND)).withClause(new API.Clause(new API.Restriction("key4", API.Comparators.EQ, "[[range_to]]"), API.Operators.AND));

                            // Build query and verify
                            var substituedFilter = ctx.datasource.buildQuery(filter, options);
                            expect(substituedFilter.clauses[0].restriction.value).to.equal(ctx.range_from);
                            expect(substituedFilter.clauses[1].restriction.value).to.equal(ctx.range_to);
                            expect(substituedFilter.clauses[2].restriction.value).to.equal(ctx.range_from);
                            expect(substituedFilter.clauses[3].restriction.value).to.equal(ctx.range_to);
                        });

                        it('should include $range_from and $range_to when building the query', function () {
                            var filter = new API.Filter();
                            var actualFilter = ctx.datasource.buildQuery(filter, {});
                            expect(actualFilter.clauses.length).to.equal(0);

                            // Try building it with enforced range
                            actualFilter = ctx.datasource.buildQuery(filter, {
                                enforceTimeRange: true,
                                range: {
                                    from: ctx.range_from,
                                    to: ctx.range_to
                                }
                            });
                            expect(filter).not.to.equal(actualFilter);
                            expect(actualFilter.clauses.length).to.equal(1);
                            expect(actualFilter.clauses[0].restriction.clauses[0].restriction.value).to.equal(ctx.range_from);
                            expect(actualFilter.clauses[0].restriction.clauses[1].restriction.value).to.equal(ctx.range_to);
                        });

                        it('should turn a node criteria fs:fid restriction into 2 separate clauses', function () {
                            var filter = new API.Filter().withClause(new API.Clause(new API.Restriction('node', API.Comparators.EQ, 'FS:FID'), API.Operators.AND));

                            var actualFilter = ctx.datasource.buildQuery(filter, {});
                            expect(filter).not.to.equal(actualFilter);
                            expect(actualFilter.clauses.length).to.equal(1);
                            expect(actualFilter.clauses[0].restriction.clauses[0].restriction.value).to.equal('FS');
                            expect(actualFilter.clauses[0].restriction.clauses[1].restriction.value).to.equal('FID');
                        });

                        it('should turn a node criteria ID restriction into a node.id clause', function () {
                            var filter = new API.Filter().withClause(new API.Clause(new API.Restriction('node', API.Comparators.EQ, '1'), API.Operators.AND));

                            var actualFilter = ctx.datasource.buildQuery(filter, {});
                            expect(filter).not.to.equal(actualFilter);
                            expect(actualFilter.clauses.length).to.equal(1);
                            expect(actualFilter.clauses[0].restriction.attribute).to.equal('node.id');
                            expect(actualFilter.clauses[0].restriction.value).to.equal('1');
                        });

                        it('should handle multi-select with 0 values selected', function () {
                            var filter = new API.Filter().withClause(new API.Clause(new API.Restriction('severity', API.Comparators.EQ, '$severity'), API.Operators.AND));

                            ctx.templateSrv.init([{
                                name: 'severity',
                                multi: true,
                                current: {
                                    value: []
                                }
                            }]);

                            var actualFilter = ctx.datasource.buildQuery(filter, {});
                            expect(filter).not.to.equal(actualFilter);
                            expect(actualFilter.clauses.length).to.equal(1);
                            expect(actualFilter.clauses[0].restriction.clauses).not.to.equal(null);
                            expect(actualFilter.clauses[0].restriction.clauses.length).to.equal(0);
                        });

                        it('should handle multi-select with 1 value selected', function () {
                            var filter = new API.Filter().withClause(new API.Clause(new API.Restriction('severity', API.Comparators.EQ, '$severity'), API.Operators.AND));

                            ctx.templateSrv.init([{
                                name: 'severity',
                                multi: true,
                                current: {
                                    value: ['NORMAL']
                                }
                            }]);

                            var actualFilter = ctx.datasource.buildQuery(filter, {});
                            expect(filter).not.to.equal(actualFilter);
                            expect(actualFilter.clauses.length).to.equal(1);
                            expect(actualFilter.clauses[0].restriction.attribute).to.equal('severity');
                            expect(actualFilter.clauses[0].restriction.value).to.equal('NORMAL');
                        });

                        it('should handle multi-select with 2 values selected', function () {
                            var filter = new API.Filter().withClause(new API.Clause(new API.Restriction('severity', API.Comparators.EQ, '$severity'), API.Operators.AND));

                            ctx.templateSrv.init([{
                                name: 'severity',
                                multi: true,
                                current: {
                                    value: ['NORMAL', 'WARNING']
                                }
                            }]);

                            var actualFilter = ctx.datasource.buildQuery(filter, {});
                            expect(filter).not.to.equal(actualFilter);
                            expect(actualFilter.clauses.length).to.equal(1);
                            expect(actualFilter.clauses[0].restriction.clauses).not.to.equal(null);
                            expect(actualFilter.clauses[0].restriction.clauses.length).to.equal(2);
                            expect(actualFilter.clauses[0].restriction.clauses[0].restriction.value).to.equal('NORMAL');
                            expect(actualFilter.clauses[0].restriction.clauses[1].restriction.value).to.equal('WARNING');
                        });
                    });
                });
            });
        }
    };
});
//# sourceMappingURL=fault_ds_datasource_spec.js.map
