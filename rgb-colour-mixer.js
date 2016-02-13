/*
 * rgb-colour-mixer.js v1.0.0
 * Copyright (c) 2016 Grant McLean (grant@mclean.net.nz)
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://opensource.org/licenses/MIT
 *   http://opensource.org/licenses/GPL-3.0
 *
 */

(function($) {

    "use strict";

    function rgb_string(colour) {
        return 'rgb(' + colour.red + ',' + colour.green + ',' + colour.blue + ')';
    }

    /* RGBColourMixer class definition
     * ===============================
     */

    function RGBColourMixer (element, options) {
        this.$el = $(element);
        this.options = $.extend({}, $.fn.rgb_colour_mixer.defaults, options);
        this.colour = this.options.initial_colour;
        this.build_ui();
    }

    RGBColourMixer.prototype = {

        constructor: RGBColourMixer

        ,build_ui: function() {
            this.$sliders = $('<div />').addClass('sliders');
            this.$el.append(this.$sliders);
            this.load_svg();
        }

        ,load_svg: function() {
            var mixer = this;

            jQuery.ajax({
                url: 'rgb-colour-mixer.svg',
                type: 'GET',
                dataType: 'text',
                success: function(svg) {
                    mixer.$value = $('<div />').addClass('value');
                    mixer.$el.append(
                        $('<div />').addClass('indicator').append(mixer.$value, svg)
                    );
                    mixer.add_sliders();
                }
            });

        }

        ,add_sliders: function() {
            this.sliders = {};
            this.add_slider('red');
            this.add_slider('green');
            this.add_slider('blue');
        }

        ,add_slider: function(part) {
            var slider = new RGBColourSlider(this, part);
            this.sliders[part] = slider;
            this.$sliders.append(slider.$el);
            slider.init(this.colour[part]); // need to wait until added to DOM
        }

        ,set_component_color: function(part, value) {
            var colour = {red: 0, green: 0, blue: 0};
            colour[part] = value;
            this.$el.find('#mix-' + part).css('fill', rgb_string(colour));
            this.colour[part] = value;
            this.$el.find('#mix-result').css('fill', rgb_string(this.colour));
            this.show_rgb_hex();
        }

        ,show_rgb_hex: function() {
            var rgb = this.colour.red * 65536 + this.colour.green * 256 + this.colour.blue;
            var hex = ('00000' + rgb.toString(16).toUpperCase()).substr(-6);
            this.$value.text('#' + hex);
        }

    };


    /* RGBColourSlider class definition
     * ================================
     */

    function RGBColourSlider (mixer, colour_part) {
        this.mixer = mixer;
        this.colour_part = colour_part;
        this.build_ui();
    }

    RGBColourSlider.prototype = {

        constructor: RGBColourSlider

        ,build_ui: function() {
            var slider = this;
            this.$track = $('<div />').addClass('track');
            this.$knob  = $('<div />').addClass('knob');
            this.$value = $('<div />').addClass('value');
            this.$el = $('<div />').addClass('slider').append(
                $('<h1 />').text(this.colour_part),
                this.$track,
                this.$knob,
                this.$value
            );
            this.$knob.on('mousedown', function(e) { slider.on_mousedown(e) });
            this.$el.on('wheel', function(e) { slider.on_scrollwheel(e) });
        }

        ,init: function(value) {
            var $el = this.$el;
            var width = $el.width();
            var center = width / 2;
            var track_width = this.$track.outerWidth();
            var tpad = 10;
            $el.find('.track').css({
                left: center - track_width / 2,
                height: 256 + tpad * 2
            });
            var knob_width = this.$knob.outerWidth();
            var knob_height = this.$knob.outerHeight();
            $el.find('.knob').css('left', center - knob_width / 2);
            this.knob_origin = this.$track.position().top + 256 + tpad - knob_height / 2;
            this.set(value);
        }

        ,set: function(value) {
            this.value = value;
            this.mixer.set_component_color(this.colour_part, value);
            this.$knob.css('top', this.knob_origin - value);
            this.$value.text(('00' + value).substr(-3));
        }

        ,on_mousedown: function(e) {
            var slider = this;
            e.preventDefault();
            $(document).one('mouseup', function(e) { slider.on_mouseup(e) });
            $(document).on('mousemove', function(e) { slider.on_mousemove(e) });
            this.drag_offset = e.pageY - 255 + this.value;
        }

        ,on_mouseup: function(e) {
            $(document).off('mousemove');
        }

        ,on_mousemove: function(e) {
            var value = this.drag_offset - e.pageY + 255;
            value = Math.max(Math.min(value, 255), 0);
            if(value !== this.value) {
                this.set(value);
            }
        }

        ,on_scrollwheel: function(e) {
            e.preventDefault();
            var delta = e.originalEvent.deltaY;
            var value = this.value;
            if(delta < 0 && value < 255) {
                this.set(value + 1);
            }
            else if(delta > 0 && value > 0) {
                this.set(value - 1);
            }
        }

    };


    /* rgb_colour_mixer plugin definition
     * ==================================
     */

    $.fn.rgb_colour_mixer = function (options) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('rgb_colour_mixer');
            if(!data) {
                data = new RGBColourMixer(this, options);
                $this.data('rgb_colour_mixer', data);
            }
        })
    };

    $.fn.rgb_colour_mixer.defaults = {
        mixer_image     : 'rgb-colour-mixer.svg',
        initial_colour  : {red: 0, green: 0, blue: 0}
    };

    $('#mixer').rgb_colour_mixer();

})(window.jQuery);
