/*jsl:import ipa.js */
/*  Authors:
 *    Endi Sukma Dewata <edewata@redhat.com>
 *    Adam Young <ayoung@redhat.com>
 *    Pavel Zuna <pzuna@redhat.com>
 *
 * Copyright (C) 2010 Red Hat
 * see file 'COPYING' for use and warranty information
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* REQUIRES: ipa.js */

IPA.checkbox_column_width = 22;
IPA.required_indicator = '*';

IPA.widget = function(spec) {

    spec = spec || {};

    var that = {};

    that.name = spec.name;
    that.id = spec.id;
    that.label = spec.label;
    that.tooltip = spec.tooltip;
    that.entity = spec.entity; //some old widgets still need it

    that.create = function(container) {
        container.addClass('widget');
        that.container = container;
    };

    that.clear = function() {
    };

    that.set_visible = function(visible) {

        if (visible) {
            that.container.show();
        } else {
            that.container.hide();
        }
    };

    that.widget_create = that.create;

    return that;
};

IPA.input_widget = function(spec) {

    spec = spec || {};

    var that = IPA.widget(spec);

    that.width = spec.width;
    that.height = spec.height;

    that.undo = spec.undo === undefined ? true : spec.undo;
    that.writable = spec.writable === undefined ? true : spec.writable;
    that.read_only = spec.read_only;
    that.hidden = spec.hidden;

    //events
    //each widget can contain several events
    that.value_changed = IPA.observer();
    that.undo_clicked = IPA.observer();


    that.create_error_link = function(container) {
        container.append(' ');

        $('<span/>', {
            name: 'error_link',
            html: IPA.messages.widget.validation.error,
            'class': 'ui-state-error ui-corner-all',
            style: 'display:none'
        }).appendTo(container);
    };

    that.create_required = function(container) {
        that.required_indicator = $('<span/>', {
            'class': 'required-indicator',
            text: IPA.required_indicator,
            style: 'display: none;'
        }).appendTo(container);
    };

    that.update = function() {
    };

    /**
     * This function saves the values entered in the UI.
     * It returns the values in an array, or null if
     * the field should not be saved.
     */
    that.save = function() {
        return [];
    };

    /**
     * This function creates an undo link in the container.
     * On_undo is a link click callback. It can be specified to custom
     * callback. If a callback isn't set, default callback is used. If
     * spefified to value other than a function, no callback is registered.
     */
    that.create_undo = function(container, on_undo) {
        container.append(' ');

        that.undo_span =
            $('<span/>', {
                name: 'undo',
                style: 'display: none;',
                'class': 'ui-state-highlight ui-corner-all undo',
                html: IPA.messages.widget.undo
            }).appendTo(container);

        if(on_undo === undefined) {
            on_undo = function() {
                that.undo_clicked.notify([], that);
            };
        }

        if(typeof on_undo === 'function') {
            that.undo_span.click(on_undo);
        }
    };

    that.get_undo = function() {
        return $(that.undo_span);
    };

    that.show_undo = function() {
        that.get_undo().css('display', 'inline');
    };

    that.hide_undo = function() {
        $(that.undo_span).css('display', 'none');
    };

    that.get_error_link = function() {
        return $('span[name="error_link"]', that.container);
    };

    that.show_error = function(message) {
        var error_link = that.get_error_link();
        error_link.html(message);
        error_link.css('display', 'block');
    };

    that.hide_error = function() {
        var error_link = that.get_error_link();
        error_link.css('display', 'none');
    };

    that.set_required = function(required) {

        that.required = required;

        if (that.required_indicator) {
            that.required_indicator.css('display', that.required ? 'inline' : 'none');
        }
    };

    that.focus_input = function() {};
    that.set_deleted = function() {};

    // methods that should be invoked by subclasses
    that.widget_hide_error = that.hide_error;
    that.widget_show_error = that.show_error;

    return that;
};

/*uses a browser specific technique to select a range.*/
IPA.select_range = function(input,start, end) {
    input.focus();
    if (input[0].setSelectionRange) {
        input[0].setSelectionRange(start, end);
    } else if (input[0].createTextRange) {
        var range = input[0].createTextRange();
        range.collapse(true);
        range.moveEnd('character', end);
        range.moveStart('character', start);
        range.select();
    }
};


IPA.text_widget = function(spec) {

    spec = spec || {};

    var that = IPA.input_widget(spec);

    that.size = spec.size || 30;
    that.type = spec.type || 'text';

    that.select_range = function(start, end){
        IPA.select_range(that.input, start, end);
    };

    that.create = function(container) {

        that.widget_create(container);

        container.addClass('text-widget');

        that.display_control = $('<label/>', {
            name: that.name,
            style: 'display: none;'
        }).appendTo(container);

        that.input = $('<input/>', {
            type: that.type,
            name: that.name,
            disabled: that.disabled,
            size: that.size,
            title: that.tooltip,
            keyup: function() {
                that.value_changed.notify([], that);
            }
        }).appendTo(container);

        if (that.undo) {
            that.create_undo(container);
        }

        that.create_error_link(container);
    };

    that.update = function(values) {
        var value = values && values.length ? values[0] : '';

        if (that.read_only || !that.writable) {
            that.display_control.text(value);
            that.display_control.css('display', 'inline');
            that.input.css('display', 'none');

        } else {
            that.input.val(value);
            that.display_control.css('display', 'none');
            that.input.css('display', 'inline');
        }
    };

    that.save = function() {
        if (that.read_only || !that.writable) {
            return null;

        } else {
            var value = that.input.val();
            return value === '' ? [] : [value];
        }
    };

    that.set_enabled = function(value) {

        if(value) {
            that.input.removeAttr('disabled');
        } else {
            that.input.attr('disabled', 'disabled');
        }
    };

    that.clear = function() {
        that.input.val('');
        that.display_control.text('');
    };

    that.focus_input = function() {
        that.input.focus();
    };

    that.set_deleted = function(deleted) {
        if(deleted) {
            that.input.addClass('strikethrough');
        } else {
            that.input.removeClass('strikethrough');
        }
    };

    // methods that should be invoked by subclasses
    that.text_load = that.load;

    return that;
};

IPA.password_widget = function(spec) {

    spec = spec || {};
    spec.type = 'password';

    var that = IPA.text_widget(spec);
    return that;
};

IPA.multivalued_text_widget = function(spec) {

    spec = spec || {};

    var that = IPA.input_widget(spec);

    that.widget_factory = spec.widget_factory || IPA.text_widget;
    that.size = spec.size || 30;
    that.undo_control;
    that.initialized = false;

    that.rows = [];

    that.on_child_value_changed = function(row) {
        if(that.test_dirty_row(row)) {
            row.widget.show_undo();
            row.remove_link.hide();
        }

        that.value_changed.notify([], that);
    };

    that.on_child_undo_clicked = function(row) {
        if (row.is_new) {
            that.remove_row(row);
        } else {
            //reset
            row.widget.update(row.original_values);
            row.widget.set_deleted(false);
            row.deleted = false;
            row.remove_link.show();
        }

        row.widget.hide_undo();
        that.value_changed.notify([], that);
    };

    that.hide_undo = function() {

        $(that.undo_span).css('display', 'none');
        for(var i=0; i<that.rows.length; i++) {
            var row = that.rows[i];
            row.widget.hide_undo();
            if(row.is_new) row.remove_link.show();
        }
    };


    that.update_child = function(values, index) {
        that.rows[index].widget.update(values);
    };

    that.show_child_undo = function(index) {
        that.rows[index].widget.show_undo();
        that.show_undo();
    };

    that.save = function() {

        var values = [];

        for (var i=0; i<that.rows.length;i++) {

            if(that.rows[i].deleted) continue;

            values.push(that.extract_child_value(that.rows[i].widget.save()));
        }

        return values;
    };

    that.extract_child_value = function(value) {

        if (value.length) return value[0];
        if (value) return value;
        return '';
    };

    that.focus_last = function() {
        var last_row = that.rows[that.rows.length-1];
        last_row.widget.focus_input();
    };

    that.add_row = function(values) {
        var row = {};
        that.rows.push(row);
        var row_index = that.rows.length - 1;
        row.is_new = that.initialized;

        row.container = $('<div/>', { name: 'value'});

        row.widget = that.widget_factory({
            name: that.name+'-'+row_index,
            undo: that.undo,
            read_only: that.read_only,
            writable: that.writable
        });

        row.widget.create(row.container);

        row.original_values = values;
        row.widget.update(values);

        row.widget.value_changed.attach(function() {
            that.on_child_value_changed(row);
        });
        row.widget.undo_clicked.attach(function() {
            that.on_child_undo_clicked(row);
        });

        row.remove_link = $('<a/>', {
            name: 'remove',
            href: 'jslink',
            title: IPA.messages.buttons.remove,
            html: IPA.messages.buttons.remove,
            click: function () {
                that.remove_row(row);
                that.value_changed.notify([], that);
                return false;
            }
        }).appendTo(row.container);

        if(row.is_new) {
            row.remove_link.hide();
            row.widget.show_undo();
            that.value_changed.notify([], that);
        }

        row.container.insertBefore(that.add_link);
    };

    that.create = function(container) {

        container.addClass('multivalued-text-widget');

        that.widget_create(container);

        that.create_error_link(container);

        that.add_link = $('<a/>', {
            name: 'add',
            href: 'jslink',
            title: IPA.messages.buttons.add,
            html: IPA.messages.buttons.add,
            click: function() {
                that.add_row('');
                that.focus_last();
                return false;
            }
        }).appendTo(container);


        container.append(' ');

        that.undo_span = $('<span/>', {
            name: 'undo_all',
            style: 'display: none;',
            'class': 'ui-state-highlight ui-corner-all undo',
            html: IPA.messages.widget.undo_all,
            click: function() {
                that.undo_clicked.notify([], that);
            }
        }).appendTo(container);
    };

    that.remove_row = function(row) {
        if (row.is_new) {
            row.container.remove();
            that.rows.splice(that.rows.indexOf(row), 1); //not supported by IE<9
        } else {
            row.deleted = true;
            row.widget.set_deleted(true);
            row.remove_link.hide();
            row.widget.show_undo();
        }
    };

    that.remove_rows = function() {
        for(var i=0; i < that.rows.length; i++) {
            that.rows[i].container.remove();
        }
        that.rows = [];
    };

    that.clear = function() {
        that.remove_rows();
    };

    that.test_dirty_row = function(row) {

        if(row.deleted || row.is_new) return true;

        var values = row.widget.save();

        for (var i=0; i<values.length; i++) {
            if (values[i] !== row.original_values[i]) {
                return true;
            }
        }

        return false;
    };

    that.test_dirty = function() {
        var dirty = false;

        for(var i=0; i < that.rows.length; i++) {
            dirty = dirty || that.test_dirty_row(that.rows[i]);
        }

        return dirty;
    };

    that.update = function(values, index) {

        var value;

        if (index === undefined) {

            that.initialized = false;
            that.remove_rows();

            for (var i=0; i<values.length; i++) {
                value = [values[i]];
                if(value[0]) {
                    that.add_row(value);
                }
            }

            that.initialized = true;

            if (that.read_only || !that.writable) {
                that.add_link.css('display', 'none');
            } else {
                that.add_link.css('display', 'inline');
            }

        } else {
            value = values[index];
            var row = that.rows[index];
            row.widget.update(values);
        }
    };

    return that;
};

IPA.checkbox_widget = function (spec) {

    spec = spec || {};

    var that = IPA.input_widget(spec);

    // default value
    that.checked = spec.checked || false;

    that.create = function(container) {

        that.widget_create(container);

        container.addClass('checkbox-widget');

        that.input = $('<input/>', {
            type: 'checkbox',
            name: that.name,
            checked: that.checked,
            title: that.tooltip,
            change: function() {
                that.value_changed.notify([that.save()], that);
            }
        }).appendTo(container);

        if (that.undo) {
            that.create_undo(container);
        }

        that.create_error_link(container);
    };

    that.save = function() {
        var value = that.input.is(':checked');
        return [value];
    };

    that.update = function(values) {
        var value;

        if (values && values.length) {
            // use loaded value
            value = values[0];
        } else {
            // use default value
            value = that.checked;
        }

        // convert string into boolean
        if (value === 'TRUE') {
            value = true;
        } else if (value === 'FALSE') {
            value = false;
        }

        that.input.attr('checked', value);
    };

    that.clear = function() {
        that.input.attr('checked', false);
    };

    that.checkbox_save = that.save;

    return that;
};

IPA.checkboxes_widget = function (spec) {

    spec = spec || {};

    var that = IPA.input_widget(spec);

    that.options = spec.options || [];
    that.direction = spec.direction || 'vertical';

    that.create = function(container) {

        that.widget_create(container);

        container.addClass('checkboxes-widget');

        var vertical = that.direction === 'vertical';

        for (var i=0; i<that.options.length; i++) {
            var option = that.options[i];
            $('<input/>', {
                type: 'checkbox',
                name: that.name,
                value: option.value,
                title: that.tooltip
            }).appendTo(container);

            $('<label/>', {
                text: option.label,
                title: that.tooltip
            }).appendTo(container);

            if (vertical) {
                $('<br/>').appendTo(container);
            }
        }

        if (that.undo) {
            that.create_undo(container);
        }

        var input = $('input[name="'+that.name+'"]', that.container);
        input.change(function() {
            that.value_changed.notify([that.save()], that);
        });

        that.create_error_link(container);
    };

    that.save = function() {
        var values = [];

        $('input[name="'+that.name+'"]:checked', that.container).each(function() {
            values.push($(this).val());
        });

        return values;
    };

    that.update = function(values) {
        var inputs = $('input[name="'+that.name+'"]', that.container);
        inputs.attr('checked', false);

        for (var j=0; values && j<values.length; j++) {
            var value = values[j];
            var input = $('input[name="'+that.name+'"][value="'+value+'"]', that.container);
            if (!input.length) continue;
            input.attr('checked', true);
        }
    };

    that.clear = function() {
        $('input[name="'+that.name+'"]').attr('checked', false);
    };

    that.add_option = function(option) {
        that.options.push(option);
    };

    // methods that should be invoked by subclasses
    that.checkboxes_update = that.update;

    return that;
};

IPA.radio_widget = function(spec) {

    spec = spec || {};

    var that = IPA.input_widget(spec);

    that.options = spec.options;

    that.create = function(container) {

        that.widget_create(container);

        container.addClass('radio-widget');

        var name = IPA.html_util.get_next_id(that.name+'-');
        that.selector = 'input[name="'+name+'"]';

        for (var i=0; i<that.options.length; i++) {
            var option = that.options[i];

            var id = name+'-'+i;

            $('<input/>', {
                id: id,
                type: 'radio',
                name: name,
                value: option.value
            }).appendTo(container);

            $('<label/>', {
                text: option.label,
                'for': id
            }).appendTo(container);
        }

        if (that.undo) {
            that.create_undo(container);
        }

        var input = $(that.selector, that.container);
        input.change(function() {
            that.value_changed.notify([that.save()], that);
        });

        that.create_error_link(container);
    };

    that.save = function() {
        var input = $(that.selector+':checked', that.container);
        if (!input.length) return [];
        return [input.val()];
    };

    that.update = function(values) {

        $(that.selector, that.container).each(function() {
            var input = this;
            input.checked = false;
        });

        var value = values && values.length ? values[0] : '';
        var input = $(that.selector+'[value="'+value+'"]', that.container);
        if (input.length) {
            input.attr('checked', true);
        }

        that.value_changed.notify([that.save()], that);
    };

    that.clear = function() {
        $(that.selector, that.container).attr('checked', false);
    };

    // methods that should be invoked by subclasses
    that.radio_create = that.create;
    that.radio_save = that.save;

    return that;
};

IPA.select_widget = function(spec) {

    spec = spec || {};

    var that = IPA.input_widget(spec);

    that.options = spec.options || [];

    that.create = function(container) {

        that.widget_create(container);

        container.addClass('select-widget');

        var select = $('<select/>', {
            name: that.name
        }).appendTo(container);

        for (var i=0; i<that.options.length; i++) {
            var option = that.options[i];

            $('<option/>', {
                text: option.label,
                value: option.value
            }).appendTo(select);
        }

        if (that.undo) {
            that.create_undo(container);
        }

        that.select = $('select[name="'+that.name+'"]', that.container);
        that.select.change(function() {
            that.value_changed.notify([], that);
        });

        that.create_error_link(container);
    };

    that.save = function() {
        var value = that.select.val() || '';
        return [value];
    };

    that.update = function(values) {
        var value = values[0];
        var option = $('option[value="'+value+'"]', that.select);
        if (!option.length) return;
        option.attr('selected', 'selected');
    };

    that.empty = function() {
        $('option', that.select).remove();
    };

    that.clear = function() {
        $('option', that.select).attr('selected', '');
    };

    // methods that should be invoked by subclasses
    that.select_save = that.save;
    that.select_update = that.update;

    return that;
};

IPA.textarea_widget = function (spec) {

    spec = spec || {};

    var that = IPA.input_widget(spec);

    that.rows = spec.rows || 5;
    that.cols = spec.cols || 40;

    that.create = function(container) {

        that.widget_create(container);

        container.addClass('textarea-widget');

        that.input = $('<textarea/>', {
            name: that.name,
            rows: that.rows,
            cols: that.cols,
            disabled: that.disabled,
            title: that.tooltip,
            keyup: function() {
                that.value_changed.notify([], that);
            }
        }).appendTo(container);

        if (that.undo) {
            that.create_undo(container);
        }

        that.create_error_link(container);
    };

    that.save = function() {
        var value = that.input.val();
        return [value];
    };

    that.update = function(values) {
        var value = values && values.length ? values[0] : '';
        that.input.val(value);
    };

    that.clear = function() {
        that.input.val('');
    };

    return that;
};

IPA.boolean_format = function(value) {

    if (value === undefined || value === null) return '';

    if (value instanceof Array) {
        value = value[0];
    }

    var normalized_value = typeof value === 'string' ? value.toLowerCase() : '';

    if (value === false || normalized_value === 'false') {
        return IPA.messages['false'];
    }

    if (value === true || normalized_value === 'true') {
        return IPA.messages['true'];
    }

    return value;
};

/*
  The entity name must be set in the spec either directly or via entity.name
*/
IPA.column = function (spec) {

    spec = spec || {};

    var that = {};

    that.name = spec.name;
    that.label = spec.label;
    that.width = spec.width;
    that.entity_name = spec.entity ? spec.entity.name : spec.entity_name;
    that.primary_key = spec.primary_key;
    that.link = spec.link;
    that.format = spec.format;

    if (!that.entity_name){
        var except = {
            expected: false,
            message:'Column created without an entity_name.'
        };
        throw except;
    }

    that.setup = function(container, record) {

        container.empty();

        var value = record[that.name];
        if (that.format && value) {
            value = that.format(value);
        }
        value = value ? value.toString() : '';

        if (that.link) {
            $('<a/>', {
                href: '#'+value,
                text: value,
                click: function() {
                    return that.link_handler(value);
                }
            }).appendTo(container);

        } else {
            container.text(value);
        }
    };

    that.link_handler = function(value) {
        return false;
    };


    /*column initialization*/
    if (that.entity_name && !that.label) {
        var metadata = IPA.get_entity_param(that.entity_name, that.name);
        if (metadata) {
            that.label = metadata.label;
        }
    }


    return that;
};

IPA.table_widget = function (spec) {

    spec = spec || {};

    var that = IPA.input_widget(spec);

    that.scrollable = spec.scrollable;
    that.selectable = spec.selectable === undefined ? true : spec.selectable;
    that.save_values = spec.save_values === undefined ? true : spec.save_values;
    that['class'] = spec['class'];

    that.pagination = spec.pagination;
    that.current_page = 1;
    that.total_pages = 1;
    that.page_length = spec.page_length || 20;

    that.multivalued = spec.multivalued === undefined ? true : spec.multivalued;

    that.columns = $.ordered_map();

    that.get_columns = function() {
        return that.columns.values;
    };

    that.get_column = function(name) {
        return that.columns.get(name);
    };

    that.add_column = function(column) {
        column.entity = that.entity;
        that.columns.put(column.name, column);
    };

    that.set_columns = function(columns) {
        that.clear_columns();
        for (var i=0; i<columns.length; i++) {
            that.add_column(columns[i]);
        }
    };

    that.clear_columns = function() {
        that.columns.empty();
    };

    that.create_column = function(spec) {
        var column = IPA.column(spec);
        that.add_column(column);
        return column;
    };


    that.create = function(container) {

        that.widget_create(container);

        container.addClass('table-widget');

        that.table = $('<table/>', {
            'class': 'search-table'
        }).appendTo(container);

        if (that['class']) that.table.addClass(that['class']);

        if (that.scrollable) {
            that.table.addClass('scrollable');
        }

        that.thead = $('<thead/>').appendTo(that.table);

        var tr = $('<tr/>').appendTo(that.thead);

        var th;

        if (that.selectable) {
            th = $('<th/>', {
                'style': 'width: 22px;'
            }).appendTo(tr);

            if (that.multivalued) {
                var select_all_checkbox = $('<input/>', {
                    type: 'checkbox',
                    name: that.name,
                    title: IPA.messages.search.select_all
                }).appendTo(th);

                select_all_checkbox.change(function() {
                    if(select_all_checkbox.is(':checked')) {
                        that.select_all();
                    } else {
                        that.unselect_all();
                    }
                    return false;
                });
            }
        }

        var columns = that.columns.values;
        for (var i=0; i<columns.length; i++) {
            var column = columns[i];

            th = $('<th/>').appendTo(tr);

            if (that.scrollable) {
                var width;
                if (column.width) {
                    width = parseInt(
                        column.width.substring(0, column.width.length-2),10);
                    width += 16;
                } else {
                    /* don't use the checkbox column as part of the overall
                       calculation for column widths.  It is so small
                       that it throws off the average. */
                    width = (that.table.width() -
                             (that.selectable ?
                              IPA.checkbox_column_width : 0)) /
                        columns.length;
                }
                width += 'px';
                th.css('width', width);
                column.width = width;
            } else {
                if (column.width) {
                    th.css('width', column.width);
                }
            }

            var label = column.label;

            $('<span/>', {
                'style': 'float: left;',
                'html': label
            }).appendTo(th);

            if (i == columns.length-1) {
                that.buttons = $('<span/>', {
                    'name': 'buttons',
                    'style': 'float: right;'
                }).appendTo(th);
            }
            if (that.scrollable && !column.width){
                column.width = th.width() +'px';
            }
        }

        that.tbody = $('<tbody/>').appendTo(that.table);

        if (that.height) {
            that.tbody.css('height', that.height);
        }

        that.row = $('<tr/>');

        var td;

        if (that.selectable) {
            td = $('<td/>', {
                'style': 'width: '+ IPA.checkbox_column_width +'px;'
            }).appendTo(that.row);

            if (that.multivalued) {
                $('<input/>', {
                    type: 'checkbox',
                    name: that.name,
                    value: ''
                }).appendTo(td);
            } else {
                $('<input/>', {
                    type: 'radio',
                    name: that.name,
                    value: ''
                }).appendTo(td);
            }
        }

        for (/* var */ i=0; i<columns.length; i++) {
            /* var */ column = columns[i];

            td = $('<td/>').appendTo(that.row);
            if (column.width) {
                td.css('width', column.width);
            }

            $('<span/>', {
                'name': column.name
            }).appendTo(td);
        }

        that.tfoot = $('<tfoot/>').appendTo(that.table);

        tr = $('<tr/>').appendTo(that.tfoot);

        td = $('<td/>', {
            colspan: columns.length + (that.selectable ? 1 : 0)
        }).appendTo(tr);

        that.create_error_link(td);

        that.summary = $('<span/>', {
            'name': 'summary'
        }).appendTo(td);

        that.pagination_control = $('<span/>', {
            'class': 'pagination-control'
        }).appendTo(td);

        if (that.pagination) {

            $('<a/>', {
                text: IPA.messages.widget.prev,
                name: 'prev_page',
                click: function() {
                    that.prev_page();
                    return false;
                }
            }).appendTo(that.pagination_control);

            that.pagination_control.append(' ');

            $('<a/>', {
                text: IPA.messages.widget.next,
                name: 'next_page',
                click: function() {
                    that.next_page();
                    return false;
                }
            }).appendTo(that.pagination_control);

            that.pagination_control.append(' ');
            that.pagination_control.append(IPA.messages.widget.page);
            that.pagination_control.append(': ');

            that.current_page_input = $('<input/>', {
                type: 'text',
                name: 'current_page',
                keypress: function(e) {
                    if (e.which == 13) {
                        var page = parseInt(that.current_page_input.val(), 10) || 1;
                        that.set_page(page);
                    }
                }
            }).appendTo(that.pagination_control);

            that.pagination_control.append(' / ');

            that.total_pages_span = $('<span/>', {
                name: 'total_pages'
            }).appendTo(that.pagination_control);
        }
    };

    that.prev_page = function() {
        if (that.current_page > 1) {
            that.current_page--;
            that.refresh();
        }
    };

    that.next_page = function() {
        if (that.current_page < that.total_pages) {
            that.current_page++;
            that.refresh();
        }
    };

    that.set_page = function(page) {
        if (page < 1) {
            page = 1;
        } else if (page > that.total_pages) {
            page = that.total_pages;
        }
        that.current_page = page;
        that.current_page_input.val(page);
        that.refresh();
    };

    that.select_changed = function() {
    };

    that.select_all = function() {
        $('input[name="'+that.name+'"]', that.thead).attr('checked', true).
            attr('title', IPA.messages.search.unselect_all);
        $('input[name="'+that.name+'"]', that.tbody).attr('checked', true);
        that.select_changed();
    };

    that.unselect_all = function() {
        $('input[name="'+that.name+'"]', that.thead).attr('checked', false).
            attr('title', IPA.messages.search.select_all);
        $('input[name="'+that.name+'"]', that.tbody).attr('checked', false);
        that.select_changed();
    };

    that.set_values = function(values) {
        $('input[name="'+that.name+'"]', that.tbody).attr('checked', false);
        for (var i=0; values && i<values.length; i++) {
            var value = values[i];
            $('input[name="'+that.name+'"][value="'+value+'"]', that.tbody).attr('checked', true);
        }
        that.select_changed();
    };

    that.empty = function() {
        that.tbody.empty();
    };

    that.load = function(result) {

        that.empty();

        that.values = result[that.name] || [];
        for (var i=0; i<that.values.length; i++) {
            var record = that.get_record(result, i);
            that.add_record(record);
        }
    };

    that.save = function() {
        if (that.save_values) {
            var values = [];

            $('input[name="'+that.name+'"]', that.tbody).each(function() {
                values.push($(this).val());
            });

            return values;

        } else {
            return null;
        }
    };

    that.get_selected_values = function() {
        var values = [];

        $('input[name="'+that.name+'"]:checked', that.tbody).each(function() {
            values.push($(this).val());
        });

        return values;
    };

    that.get_selected_rows = function() {
        return $('input[name="'+that.name+'"]:checked', that.tbody).closest('tr');
    };

    that.get_record = function(result, index) {

        var record = {};

        var columns = that.columns.values;
        for (var i=0; i<columns.length; i++){
            var name = columns[i].name;
            var values = result[name];
            if (!values) continue;

            if (values instanceof Array){
                record[name] = values[index];
            } else {
                record[name] = values;
            }
        }

        return record;
    };

    that.add_record = function(record) {

        var tr = that.row.clone();
        tr.appendTo(that.tbody);

        $('input[name="'+that.name+'"]', tr).click(function(){
            that.select_changed();
        });


        var columns = that.columns.values;
        for (var i=0; i<columns.length; i++){
            var column = columns[i];

            var value = record[column.name];
            value = value ? value.toString() : '';

            if (column.primary_key) {
                $('input[name="'+that.name+'"]', tr).val(value);
            }

            var span = $('span[name="'+column.name+'"]', tr);

            column.setup(span, record);
        }
    };

    that.add_rows = function(rows) {
        for (var i=0; i<rows.length; i++) {
            var tr = rows[i];
            $('input', tr).attr('name', that.name);
            that.tbody.append(tr);
        }
    };

    that.remove_selected_rows = function() {
        var rows = [];
        that.tbody.children().each(function() {
            var tr = $(this);
            if (!$('input[name="'+that.name+'"]', tr).get(0).checked) return;
            tr.detach();
            rows.push(tr);
        });
        return rows;
    };

    that.show_error = function(message) {
        var error_link = that.get_error_link();
        error_link.html(message);
        error_link.css('display', 'inline');
    };

    that.set_enabled = function(enabled) {
        if (enabled) {
            $('input[name="'+that.name+'"]', that.table).attr('disabled', false);
        } else {
            $('input[name="'+that.name+'"]', that.table).attr('disabled', true);
        }
    };

    that.clear = function() {
        that.empty();
        that.summary.text('');
    };

    //column initialization
    if (spec.columns) {
        for (var i=0; i<spec.columns; i++) {
            that.create_column(spec.columns[i]);
        }
    }

    // methods that should be invoked by subclasses
    that.table_create = that.create;
    that.table_load = that.load;
    that.table_next_page = that.next_page;
    that.table_prev_page = that.prev_page;
    that.table_set_enabled = that.set_enabled;
    that.table_set_page = that.set_page;
    that.table_show_error = that.show_error;
    that.table_set_values = that.set_values;

    return that;
};

IPA.combobox_widget = function(spec) {

    spec = spec || {};

    var that = IPA.input_widget(spec);

    that.editable = spec.editable;
    that.searchable = spec.searchable;
    that.size = spec.size || 5;
    that.empty_option = spec.empty_option === undefined ? true : spec.empty_option;
    that.options = spec.options || [];
    that.input_field_changed = IPA.observer();

    that.create = function(container) {
        that.widget_create(container);

        container.addClass('combobox-widget');

        $(document).keyup(function(e) {
            if (e.which == 27) { // Escape
                that.close();
            }
        });

        that.input_container = $('<div/>', {
            'class': 'combobox-widget-input'
        }).appendTo(container);

        that.text = $('<label/>', {
            name: that.name,
            style: 'display: none;'
        }).appendTo(that.input_container);

        that.input = $('<input/>', {
            type: 'text',
            name: that.name,
            title: that.tooltip,
            readonly: !that.editable,
            keyup: function() {
                that.input_field_changed.notify([], that);
            },
            click: function() {
                if (that.editable) return false;
                if (that.is_open()) {
                    that.close();
                } else {
                    that.open();
                }
                return false;
            }
        }).appendTo(that.input_container);

        that.open_button = IPA.action_button({
            name: 'open',
            icon: 'combobox-icon',
            click: function() {
                if (that.is_open()) {
                    that.close();
                } else {
                    that.open();
                }
                return false;
            }
        }).appendTo(that.input_container);

        that.list_container = $('<div/>', {
            'class': 'combobox-widget-list'
        }).appendTo(that.input_container);

        var div = $('<div/>', {
            style: 'position: relative; width: 100%;'
        }).appendTo(that.list_container);

        if (that.searchable) {
            that.filter = $('<input/>', {
                type: 'text',
                name: 'filter',
                keypress: function(e) {
                    if (e.which == 13) { // Enter
                        var filter = that.filter.val();
                        that.search(filter);
                    }
                }
            }).appendTo(div);

            that.search_button = IPA.action_button({
                name: 'search',
                icon: 'search-icon',
                click: function() {
                    var filter = that.filter.val();
                    that.search(filter);
                    return false;
                }
            }).appendTo(div);

            div.append('<br/>');
        }

        that.list = $('<select/>', {
            name: 'list',
            size: that.size,
            style: 'width: 100%',
            change: function() {
                var value = $('option:selected', that.list).val();
                that.input.val(value);
                IPA.select_range(that.input, 0, 0);

                that.close();
                that.value_changed.notify([[value]], that);
            }
        }).appendTo(div);

        if (that.undo) {
            that.create_undo(container);
        }

        that.create_error_link(container);
    };

    that.open = function() {
        that.list_container.css('visibility', 'visible');
    };

    that.close = function() {
        that.list_container.css('visibility', 'hidden');
    };

    that.is_open = function() {
        return that.list_container.css('visibility') == 'visible';
    };

    that.search = function(filter, on_success, on_error) {

        that.recreate_options();
        if (on_success) on_success.call(this);
    };

    that.set_options = function(options) {
        that.options = options;
        that.recreate_options();
    };

    that.recreate_options = function() {

        that.remove_options();

        if (that.empty_option) {
            that.create_option();
        }

        for (var i=0; i<that.options.length; i++) {
            var option = that.options[i];

            var label, value;
            if (option instanceof Object) {
                label = option.label;
                value = option.value;
            } else {
                label = option;
                value = option;
            }

            that.create_option(label, value);
        }
    };

    that.update = function(values) {
        that.close();

        if (that.writable) {
            that.text.css('display', 'none');
            that.input.css('display', 'inline');
            that.open_button.css('display', 'inline');
        } else {
            that.text.css('display', 'inline');
            that.input.css('display', 'none');
            that.open_button.css('display', 'none');
        }

        if (that.searchable) {
            that.filter.empty();
        }

        // In a details page the following code will get the stored value.
        // In a dialog box the value will be null.
        var value = values.length ? values[0] : null;

        // In a details page the following code will show the stored
        // value immediately without waiting to populate the list.
        // In a dialog box it will show blank.
        that.set_value(value || '');

        // In a details page the following code will populate the list
        // and select the stored value.
        // In a dialog box it will populate the list and select the first
        // available option.
        that.search(
            null,
            function(data, text_status, xhr) {
                that.select(value);
            }
        );
    };

    that.set_value = function(value) {
        that.text.text(value);
        that.input.val(value);
    };

    that.select = function(value) {

        var option;

        if (value) {
            // select specified value
            option = $('option[value="'+value+'"]', that.list);
        } else {
            // select first available option
            option = $('option', that.list).first();
        }

        // if no option found, skip
        if (!option.length) return;

        option.attr('selected', 'selected');

        that.set_value(option.val());
        that.value_changed.notify([], that);
    };

    that.save = function() {
        var value = that.input.val();
        return value === '' ? [] : [value];
    };

    that.create_option = function(label, value) {
        return $('<option/>', {
            text: label,
            value: value
        }).appendTo(that.list);
    };

    that.remove_options = function() {
        that.list.empty();
    };

    that.clear = function() {
        that.input.val('');
        that.remove_options();
    };

    return that;
};

IPA.entity_select_widget = function(spec) {

    spec = spec || {};
    spec.searchable = spec.searchable === undefined ? true : spec.searchable;

    var that = IPA.combobox_widget(spec);

    that.other_entity = spec.other_entity;
    that.other_field = spec.other_field;

    that.options = spec.options || [];

    that.create_search_command = function(filter) {
        return IPA.command({
            entity: that.other_entity,
            method: 'find',
            args: [filter]
        });
    };

    that.search = function(filter, on_success, on_error) {

        that.on_search_success = on_success;

        var command = that.create_search_command(filter);
        command.on_success = that.search_success;
        command.on_error = on_error;

        command.execute();
    };

    that.search_success = function(data, text_status, xhr) {

        //get options
        var options = [];

        var entries = data.result.result;
        for (var i=0; i<data.result.count; i++) {
            var entry = entries[i];
            var values = entry[that.other_field];
            var value = values[0];

            options.push(value);
        }

        that.set_options(options);

        if (that.on_search_success) that.on_search_success.call(this, data, text_status, xhr);
    };

    return that;
};


IPA.link_widget = function(spec) {
    var that = IPA.input_widget(spec);

    that.is_link = spec.is_link || false;
    that.link_clicked = IPA.observer();

    that.create = function(container) {
        that.widget_create(container);
        that.link =
        $('<a/>', {
            href: 'jslink',
            title: '',
            html: '',
            click: function() {
                that.link_clicked.notify([], that);
                return false;
            }
        }).appendTo(container);

        that.nonlink = $('<label/>').
            appendTo(container);
    };

    that.update = function (values){

        if (values || values.length > 0) {
            that.nonlink.text(values[0]);
            that.link.text(values[0]);
            if(that.is_link) {
                that.link.css('display','inline');
                that.nonlink.css('display','none');
            } else {
                that.link.css('display','none');
                that.nonlink.css('display','inline');
            }
        } else {
            that.link.html('');
            that.nonlink.html('');
            that.link.css('display','none');
            that.nonlink.css('display','none');
        }
    };

    that.clear = function() {
        that.nonlink.text('');
        that.link.text('');
    };


    return that;
};

IPA.action_button = function(spec) {
    var button = IPA.button(spec);
    button.removeClass("ui-state-default").addClass("action-button");
    return button;
};

IPA.button = function(spec) {

    spec = spec || {};

    var button = $('<a/>', {
        id: spec.id,
        name: spec.name,
        href: spec.href || '#' + (spec.name || 'button'),
        title: spec.title || spec.label,
        'class': 'ui-state-default ui-corner-all button',
        style: spec.style,
        click: spec.click,
        blur: spec.blur
    });

    if (spec['class']) button.addClass(spec['class']);

    if (spec.icon) {
        $('<span/>', {
            'class': 'icon '+spec.icon
        }).appendTo(button);
    }

    if (spec.label) {
        $('<span/>', {
            'class': 'button-label',
            html: spec.label
        }).appendTo(button);
    }

    return button;
};

IPA.composite_widget = function(spec) {

    spec = spec || {};

    var that = IPA.widget(spec);

    that.widgets = IPA.widget_container();

    that.create = function(container) {

        that.widget_create(container);
        that.widgets.create(container);
    };

    that.clear = function() {

        var widgets = that.widgets.get_widgets();

        for (var i=0; i< widgets.length; i++) {
            widgets[i].clear();
        }
    };

    that.composite_widget_create = that.create;
    that.composite_widget_clear = that.clear;

    return that;
};

IPA.collapsible_section = function(spec) {

    spec = spec || {};

    var that = IPA.composite_widget(spec);

    that.create = function(container) {

        that.widget_create(container);

        that.header = $('<h2/>', {
            name: that.name,
            title: that.label
        }).appendTo(container);

        that.icon = $('<span/>', {
            name: 'icon',
            'class': 'icon section-expand '+IPA.expanded_icon
        }).appendTo(that.header);

        that.header.append(' ');

        that.header.append(that.label);

        that.content_container = $('<div/>', {
            name: that.name,
            'class': 'details-section'
        }).appendTo(container);

        that.header.click(function() {
            var visible = that.content_container.is(":visible");
            that.toggle(!visible);
        });

        that.composite_widget_create(that.content_container);
    };

    that.toggle = function(visible) {

        that.icon.toggleClass(IPA.expanded_icon, visible);
        that.icon.toggleClass(IPA.collapsed_icon, !visible);

        if (visible != that.content_container.is(":visible")) {
            that.content_container.slideToggle('slow');
        }
    };

    return that;
};

IPA.details_section = IPA.collapsible_section;

IPA.details_table_section = function(spec) {

    spec = spec || {};

    var that = IPA.details_section(spec);

    that.rows = $.ordered_map();

    that.composite_widget_create = function(container) {

        that.widget_create(container);

        var table = $('<table/>', {
            'class': 'section-table'
        }).appendTo(container);

        var widgets = that.widgets.get_widgets();
        for (var i=0; i<widgets.length; i++) {
            var widget = widgets[i];
            var tr = $('<tr/>');
            that.add_row(widget.name, tr);

            if (widget.hidden) {
                tr.css('display', 'none');
            }

            tr.appendTo(table);

            var td = $('<td/>', {
                'class': 'section-cell-label',
                title: widget.label
            }).appendTo(tr);

            $('<label/>', {
                name: widget.name,
                'class': 'field-label',
                text: widget.label+':'
            }).appendTo(td);

            if(widget.create_required) {
                widget.create_required(td);
            }

            td = $('<td/>', {
                'class': 'section-cell-field',
                title: widget.label
            }).appendTo(tr);

            var widget_container = $('<div/>', {
                name: widget.name,
                'class': 'field'
            }).appendTo(td);

            widget.create(widget_container);
        }
    };


    that.add_row = function(name, row) {
        that.rows.put(name, row);
    };

    that.get_row = function(name) {
        return that.rows.get(name);
    };

    that.set_row_visible = function(name, visible) {
        var row = that.get_row(name);
        row.css('display', visible ? '' : 'none');
    };

    that.table_section_create = that.composite_widget_create;

    return that;
};

//non-collabsible section
IPA.details_table_section_nc = function(spec) {

    spec = spec || {};

    var that = IPA.details_table_section(spec);

    that.create = that.table_section_create;

    return that;
};

IPA.enable_widget = function(spec) {

    spec = spec  || {};

    var that = IPA.radio_widget(spec);

    return that;
};


IPA.header_widget = function(spec) {

    spec = spec || {};

    var that = IPA.widget(spec);

    that.level = spec.level || 3;
    that.text = spec.text;
    that.description = spec.description;

    that.create = function(container) {
        container.append($('<h'+that.level+' />', {
            text: that.text,
            title: that.description
        }));
    };

    return that;
};

IPA.observer = function(spec) {

    var that = {};

    that.listeners = [];

    that.attach = function(callback) {
        that.listeners.push(callback);
    };

    that.detach = function(callback) {
        for(var i=0; i < that.listeners.length; i++) {
            if(callback === that.listeners[i]) {
                that.listeners.splice(i,1);
                break;
            }
        }
    };

    that.notify = function(args, context) {
        args = args || [];
        context = context || this;

        for(var i=0; i < that.listeners.length; i++) {
            that.listeners[i].apply(context, args);
        }
    };

    return that;
};

IPA.html_util = function() {

    var that = {};
    that.id_count = 0;

    that.get_next_id = function(prefix) {
        that.id_count++;
        return prefix ? prefix + that.id_count : that.id_count;
    };

    return that;
}();

IPA.widget_container = function(spec) {

    spec = spec || {};

    var that = {};

    that.new_container_for_child = spec.new_container_for_child !== undefined ?
    spec.new_container_for_child : true;

    that.widgets = $.ordered_map();
    that.widget_builder = spec.widget_builder || IPA.widget_builder();

    that.add_widget = function(widget) {
        that.widgets.put(widget.name, widget);
    };

    that.get_widget = function(path) {

        var path_len = path.length;
        var i = path.indexOf('.');
        var name, child_path, widget, child;

        if (i >= 0) {
            name = path.substring(0, i);
            child_path = path.substring(i + 1);

            child = that.widgets.get(name);
            widget = child.widgets.get_widget(child_path);
        } else {
            widget = that.widgets.get(path);
        }

        return widget;
    };

    that.get_widgets = function() {
        return that.widgets.values;
    };

    that.create = function(container) {

        var widgets = that.widgets.values;
        for (var i=0; i<widgets.length; i++) {
            var widget = widgets[i];

            var child_container = container;
            if(that.new_container_for_child) {
                child_container = $('<div/>', {
                    name: widget.name,
                    title: widget.label,
                    'class': widget['class']
                }).appendTo(container);
            }
            widget.create(child_container);

            if(i < widgets.length - 1) {
                that.create_widget_delimiter(container);
            }
        }
    };

    that.clear = function() {

        var widgets = that.widgets.values;
        for (var i=0; i<widgets.length; i++) {
            widgets[i].clear();
        }
    };

    that.create_widget_delimiter = function(container) {
    };

    that.widget_container_create = that.create;
    that.widget_container_clear = that.clear;

    return that;
};

IPA.widget_builder = function(spec) {

    spec = spec || {};

    var that = {};

    that.default_factory = spec.default_factory || IPA.text_widget;
    that.container = spec.container;
    that.widget_options = spec.widget_options || {};

    that.get_widget_factory = function(spec) {

        var factory;
        if (spec.factory) {
            factory = spec.factory;
        } else if(spec.type) {
            factory = IPA.widget_factories[spec.type];
        }

        if (!factory) {
            factory = that.default_factory;
        }

        return factory;
    };

    that.build_widget = function(spec, container) {

        container = container || that.container;

        if(!(spec instanceof Object)) {
            spec = { name: spec };
        }

        if(that.widget_options) {
            $.extend(spec, that.widget_options);
        }

        var factory = that.get_widget_factory(spec);

        var widget = factory(spec);

        if(container) {
            container.add_widget(widget);
        }

        if(spec.widgets) {
            that.build_widgets(spec.widgets, widget.widgets);
        }

        return widget;
    };

    that.build_widgets = function(specs, container) {

        container = container || that.container;

        for(var i=0; i<specs.length; i++) {
            that.build_widget(specs[i], container);
        }
    };

    return that;
};

IPA.widget_factories['text'] = IPA.text_widget;
IPA.widget_factories['password'] = IPA.password_widget;
IPA.widget_factories['checkbox'] = IPA.checkbox_widget;
IPA.widget_factories['checkboxes'] = IPA.checkboxes_widget;
IPA.widget_factories['radio'] = IPA.radio_widget;
IPA.widget_factories['multivalued'] = IPA.multivalued_text_widget;
IPA.widget_factories['select'] = IPA.select_widget;
IPA.widget_factories['textarea'] = IPA.textarea_widget;
IPA.widget_factories['entity_select'] = IPA.entity_select_widget;
IPA.widget_factories['combobox'] = IPA.combobox_widget;
IPA.widget_factories['link'] = IPA.link_widget;
IPA.widget_factories['details_table_section'] = IPA.details_table_section;
IPA.widget_factories['details_table_section_nc'] = IPA.details_table_section_nc;
IPA.widget_factories['enable'] = IPA.enable_widget;
