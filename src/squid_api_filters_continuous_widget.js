/*
 * A DatePicker widget.
 * Uses http://jqueryui.com/datepicker/
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD.
        define(['Backbone', 'squid_api'], factory);
    } else {
        root.squid_api.view.ContinuousFilterView = factory(root.Backbone, root.squid_api);
    }
}(this, function (Backbone, squid_api) {

    var View = Backbone.View.extend({

        enable: true,
        startDate: null,
        endDate: null,
        minDate: null,
        maxDate: null,
        model: null,
        initialized : false,
        pickerVisible : false,
        pickerAlwaysVisible : false,
        parent : null,
        template : squid_api.template.squid_api_filters_continuous_widget,
        ranges : null,
        rangesPresets : {
            'all': function(min, max) { return [moment.utc(min), moment.utc(max)]; },
            'first-month': function(min, max) { return [moment.utc(min).startOf('month'), moment.utc(min).endOf('month')]; },
            'last-month': function(min, max) { return [moment.utc(max).startOf('month'), moment.utc(max).endOf('month')]; }
        },

        initialize: function(options) {
            if (this.model) {
                this.model.on('change', this.render, this);
            }

            if (options.pickerVisible && (options.pickerVisible === true)) {
                this.pickerVisible = true;
                this.pickerAlwaysVisible = true;
            }
            
            if (options.ranges) {
                this.ranges = options.ranges;
            }

        },

        setModel: function(model) {
            this.model = model;
            this.initialize();
        },

        setTemplate : function(t) {
            if (t) {
                this.template = t;
            }
        },

        getSelectedItems: function() {
            var d1 = this.startDate;
            var d2 = this.endDate;
            var selectedItems = [];
            selectedItems.push({
                "lowerBound": d1,
                "upperBound": d2,
                "type": "i"
            });
            return selectedItems;
        },

        render: function() {
            if (this.model && this.model.get('dimension')) {
                var items = this.model.get('items');
                var selItems = this.model.get('selectedItems');
                var name = this.model.get('dimension').name;
                var facetId = this.model.get('facetId');

                var dateAvailable = false;
                if (items && items.length > 0) {
                    // compute min and max dates
                    for (var i=0; i<items.length; i++) {
                        var lowerDate = moment.utc(items[i].lowerBound);
                        if ((!this.minDate) || (lowerDate < this.minDate)) {
                            this.minDate = lowerDate;
                        }
                        var upperDate = moment.utc(items[i].upperBound);
                        if ((!this.maxDate) || (upperDate > this.maxDate)) {
                            this.maxDate = upperDate;
                        }
                    }
                    // set flag to indicate the date is available
                    dateAvailable = true;
                    // get start date and end date (in string format)
                    this.startDate = this.minDate;
                    this.endDate = this.maxDate;
                    if (selItems && selItems.length > 0) { // dates are selected
                        // get selected values instead
                        this.startDate = moment.utc(selItems[0].lowerBound);
                        this.endDate = moment.utc(selItems[0].upperBound);
                    }
                }
                
                // build the date pickers
                var selHTML = "";
                selHTML = this.template({
                    dateAvailable: dateAvailable,
                    facetId: facetId,
                    name: name,
                    startDateVal: this.startDate,
                    endDateVal: this.endDate
                });

                // render HTML
                this.$el.html(selHTML);

                if (dateAvailable) {
                    var me = this;
                    me.renderPicker(me);
                    this.initialized = true;
                }

            }

            return this;
        },

        renderPicker : function(me) {
            if (me.pickerVisible) {
                // compute the ranges
                var pickerRanges = {};
                for (var rangeName in me.ranges) {
                    var value = me.ranges[rangeName];
                    var func = null;
                    if ((typeof value === "string") || (value instanceof String)) {
                        // check for a predefined range
                        if (me.rangesPresets[value]) {
                            func = me.rangesPresets[value];
                        }
                    } else {
                        func = value;
                    }
                    if (func) {
                        pickerRanges[rangeName] = func.call(this, me.minDate, me.maxDate);
                    }
                }

                // Build Date Picker
                this.$el.find("button").daterangepicker(
                        {
                            opens: me.parent.datePickerPosition,
                            format: 'YYYY-MM-DD',
                            startDate: me.startDate,
                            endDate: me.endDate,
                            minDate: me.minDate,
                            maxDate: me.maxDate,
                            showDropdowns: true,
                            ranges: pickerRanges
                        }
                );

                var dateItems;

                // Detect Apply Action
                this.$el.find("button").on('apply.daterangepicker', function(ev, picker) {

                    // Update Change Selection upon date widget close
                    var startDate = moment.utc(picker.startDate).toDate();
                    var endDate = moment.utc(picker.endDate).toDate();
                    me.startDate = startDate;
                    me.endDate = endDate;

                    if (me.parent) {
                        me.parent.changeSelection(me);
                        me.parent.applySelection(me);
                    }
                });

                // Detect Cancel Action
                this.$el.find("button").on('cancel.daterangepicker', function(ev, picker) {
                    if (me.parent) {
                        me.parent.cancelSelection(me);
                    }
                });

                this.$el.find("button").on('change.daterangepickerLeft', function(ev) {
                    $('.daterangepicker').find('.left td.available:not(.off):first').trigger('click');
                });

                this.$el.find("button").on('change.daterangepickerRight', function(ev) {
                    $('.daterangepicker').find('.right td.available:not(.off):last').trigger('click');
                });
            }
        },

        setEnable: function(enable) {
            this.enable = enable;
        }
    });

    return View;
}));
