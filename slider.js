var Slider = (function(){
    "use strict";
    var defaults = {
        namespace: "slider",
        cssNamespace: "slider",
        animate: "opacity"
    };

    function Slider(container, options) {
        this.options = $.extend({}, defaults, options);

        this.container = container;
        this.$container = $(this.container);
        this.$items = this.$container.children();
        this.itemsLength = this.$items.length;

        this.$currentItem = null;
        this.currentItemId = null;
        this.$nextItem  = null;

        this.$lenta = null;
        this.next = "";
        this.prev = "";

        this.clicks = true;

        this.init();
    }

    //троттлинг
    function throttle(func, delay){
        if (this.clicks) {
            window.clearTimeout(this.clicks);
        }
        this.clicks = window.setTimeout(func, delay);
    };

    Slider.prototype.init = function() {
        //создаем каркас для слайдера
        this.render();
        this.initHandlers();

        this.options.dotes ? this.registerDotes(this.options.dotes) : this.dotes = null;
    };

    Slider.prototype.registerDotes = function(dotes) {
        this.dotes = new Dotes(dotes.name, dotes.options);
        this.dotes.init(this, this.$container, this.itemsLength);
    };

    //шаблон галереи
    Slider.prototype.render = function() {
        var cssns = this.options.cssNamespace;

        //оборачиваем каждый элемент слайдера
        this.$items.each(function(i, elem){
            var $this = $(elem);
            $this.wrap("<div class='b-lenta__item j-" + cssns + "Item' data-id='" + i + "'></div>");
        });

        var contentHtml = this.$container.html(),
            tmpl = '<div class="b-' + cssns + '__content j-' + cssns + '__content">' +
                '<div class="b-lenta j-lenta">' +
                contentHtml +
                '</div>' +
                '</div>' +
                '<div class="b-'+ cssns+ '__arrow b-' + cssns + '__arrow_left j-prev"></div>' +
                '<div class="b-' + cssns +'__arrow b-' + cssns + '__arrow_right j-next"></div>';

        //вставляем шаблон
        this.$container.empty()
            .append(tmpl);

        //переопределяем элементы слайдера
        this.$items = this.$container.find(".j-" + cssns + "Item");
        this.$lenta = this.$container.find(".j-lenta");
        this.next = ".j-next";
        this.prev = ".j-prev";

        //назначаем текущий элемент
        this.$container.width(this.options.size.width);
        this.$container.height(this.options.size.height);

        var lentaWidth = 0;
        this.$items.each(function(i, elem){
           var $this = $(this);
           lentaWidth = lentaWidth + $this.outerWidth();
        });
        this.$lenta.width(lentaWidth + this.$items.width() );
        this.setCurrentItem(0);
    };

    //обработчики
    Slider.prototype.initHandlers = function(){
        var self = this,
            ns = this.options.namespace;

        //инициализируем обработчики
        this.$container
            .on("click." + ns, this.next, function(e){
                e.preventDefault();
                throttle.call(self, function(){
                    self.go("forward");
                }, 500);
            })
            .on("click." + ns, this.prev, function(e){
                e.preventDefault();
                throttle.call(self, function(){
                    self.go("backward");
                }, 500);
            });
    };

    Slider.prototype.setCurrentItem = function(curId) {
        var self = this;
        this.currentItemId = curId;

        this.$items.each(function(i, elem){
            var $elem = $(elem),
                elemId = $elem.data("id");
            if (curId === elemId) {
                self.$currentItem  = $elem;
                self.currentItemId = elemId;
            }
        });
    };

    Slider.prototype.go = function(type) {
        var idNext,
            self = this;
        if (type === "forward") {
            this.currentItemId >= this.itemsLength - 1 ? idNext = 0 : idNext = this.currentItemId + 1;
        } else if (type === "backward") {
            this.currentItemId <= 0 ? idNext = this.itemsLength - 1 : idNext = this.currentItemId - 1;
        } else {
            idNext = type;
        }

        this.findNextItem(idNext);
        this.animate(type, idNext);
    };

    Slider.prototype.findNextItem = function(idNext){
        var self = this;
        this.$items.each(function(i, elem){
            var $elem = $(elem),
                elemId = $elem.data("id");

            if ( idNext === elemId ) {
                self.$nextItem  = $elem;
            }
        });
    };

    Slider.prototype.animate = function(type, idNext) {
        if (this.options.animate === "opacity") {
            this.animateOpacity(idNext);
        } else {
            this.animateFlipped(type, idNext);
        }
    };

    Slider.prototype.animateFlipped = function(type, idNext) {
        var left = this.$nextItem.width(),
            self = this,
            first = this.$lenta.children().first(),
            last = this.$lenta.children().last();

        if (this.dotes) this.dotes.setCurrent(idNext);

        if (type === "forward") {
            this.$lenta.animate({left: -left}, 500, function(){
                self.$lenta.css("left", "0px")
                    .append(first);
                self.setCurrentItem(idNext);
                self.$items = self.$lenta.children();
            });
        } else if (type === "backward") {
            this.$lenta.prepend( last.clone() ).css("left", -left).animate({left: 0}, 500, function(){
                self.$lenta.children().last().remove();
                self.setCurrentItem(idNext);
                self.$items = self.$lenta.children();
            });
        }
    };

    Slider.prototype.goByDots = function(idByDots) {
        this.findNextItem(idByDots);

        var self = this,
            diff = Math.abs(this.currentItemId - idByDots),
            width = this.$nextItem.width(),
            left = width * diff,
            ind = this.$nextItem.index(),
            itemsToggle = this.$lenta.children().slice(0, ind);

        if (idByDots > this.currentItemId) {
            this.$lenta.animate({"left": -left}, 500, function(){
                self.$lenta.css("left", "0px")
                    .append(itemsToggle);
                self.setCurrentItem(idByDots);
                self.$items.push.apply(self.$items, itemsToggle);
            });
        } else {
            this.$lenta.append(itemsToggle).css("left", -left).animate({left: 0}, 500, function(){
                self.$lenta.css("left", "0px");
                self.setCurrentItem(idByDots);
                self.$items.push.apply(self.$items, itemsToggle);
            });
        }
    }

    Slider.prototype.animateOpacity = function(idNext) {
        if (this.dotes) this.dotes.setCurrent(idNext);
        this.findNextItem(idNext);

        var self = this,
            left = this.$nextItem.position().left;

        this.$currentItem.animate({
            "opacity": 0
        }, 500, function(){
            self.$currentItem.css("opacity", "1");
            self.$lenta.css("left", -left+"px");
            self.setCurrentItem(idNext);
        });
    };

    return Slider;
})();

var Dotes = (function() {
    "use strict";
    var defaults = {
        namespace: "dotes",
        cssNamespace: "dotes"
    };

    function Dotes(container, options){
        this.options = $.extend({}, defaults, options);

        this.container = container;
        this.$container = null;

        this.toggle = ".j-" + this.options.namespace + "Item";
        this.$items = null;
        this.$currentItem = null;
        this.currentItemId = null;
    }

    Dotes.prototype.init = function(slider, $wrapper, count) {
        this.render($wrapper, count);
        this.initHandlers(slider, $wrapper);
    };

    Dotes.prototype.render = function($wrapper, count) {
        var cssns = this.options.cssNamespace,
            items = "";

        for (var i = 0; i < count; i++) {
            items = items + '<div class="b-dotes__wrapItem j-' + this.options.namespace + 'Item" data-id="'+ i +'"><div class="b-dotes__item"></div></div>';
        }

        var tmpl = '<div class="b-' + cssns + ' j-' + this.options.namespace + '">' + items + '</div>';
        $wrapper.append(tmpl);

        this.$container = $(this.container);

        this.$items = this.$container.find(this.toggle);
        this.setCurrent(0);
    };

    Dotes.prototype.initHandlers = function(slid, $wrapper) {
        var self = this,
            ns = this.options.namespace;

        $wrapper.on("click." + ns, self.toggle, function(e){
            e.preventDefault();
            var $this = $(this),
                idByDots = $this.data("id");

            slid.options.animate === "opacity" ? slid.go(idByDots) : slid.goByDots(idByDots);
            self.setCurrent(idByDots);
        });
    };

    Dotes.prototype.setCurrent = function(id) {
        var cssns = this.options.cssNamespace,
            self = this;

        this.currentItemId = id;
        this.$items.each(function(i, item){
            var $item = $(item),
                idItem = $item.data("id");
            if ( idItem === id ) {
                self.$currentItem = $item;
                self.$items.children().removeClass("b-" + cssns + "__item_active");
                self.$currentItem.children().addClass("b-" + cssns + "__item_active");
            }
        });
    };

    return Dotes;
})();

