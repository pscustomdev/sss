$.fn.showMore = function (options) {
    // The height of the content block when it's not expanded
    var defaults = {
        adjustHeight: 40,
        moreText: "+ More",
        lessText: "- Less"
    };
    options = $.extend({}, defaults, options);

    return this.each(function() {
        var $this, $outerDIV, height;
        $this = $(this);
        height = $this.css('height').replace('px','');

        if (height > options.adjustHeight) {
            // Sets the .more-block div to the specified height and hides any content that overflows
            $this.css('height', options.adjustHeight).css('overflow', 'hidden').addClass('more-block');

            // The section added to the bottom of the "more-less" div
            $outerDIV = ('<div class="more-less" />');
            $this.wrap($outerDIV);

            $this.parent().append('<span class="continued">... </span><a href="#" class="adjust">' + options.moreText + '</a>');

            //Set click properties
            var clicked = false;
            $(".adjust", $this.parent()).click(function () {
                var $this = $(this);
                clicked = !clicked;
                if (clicked) {
                    //More Clicked
                    $this.parents("div:first").find(".more-block").animate({height: height + 'px'},700, function() {
                        $this.text(options.lessText).parents("div:first").find("span.continued").css('display', 'none');
                    });
                } else {
                    //Less Clicked
                    $(this).parents("div:first").find(".more-block").animate({height: options.adjustHeight},700, function() {
                        $this.text(options.moreText).parents("div:first").find("span.continued").css('display', '');
                    });
                }
            });
        }
    });
};

var generateUUID = function () {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

var mergeByProperty = function (arr1, arr2, prop) {
    _.each(arr2, function(arr2obj) {
        var arr1obj = _.find(arr1, function(arr1obj) {
            return arr1obj[prop] === arr2obj[prop];
        });

        arr1obj ? _.extend(arr1obj, arr2obj) : arr1.push(arr2obj);
    });
};

var encodeHtml = function (str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
};

$(document).ready(function() {
    $(window).resize(function() {
        var bodyheight = $(this).height();
        $(".edit_file").css("height", bodyheight - 270 + "px");
        $(".edit_readme").css("height", bodyheight - 310 + "px");
        $(".create_readme").css("height", bodyheight - 490 + "px");
    });
});

