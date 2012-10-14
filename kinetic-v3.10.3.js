var Kinetic = {};
Kinetic.Global = {
    BUBBLE_WHITELIST: ['mousedown', 'mousemove', 'mouseup', 'mouseover', 'mouseout', 'click', 
    'dblclick','dragstart', 'dragmove', 'dragend'],
    stages: [],
    idCounter: 0,
    tempNodes: [],
    maxDragTimeInterval: 20,
    drag: {
        moving: false,
        offset: {
            x: 0,
            y: 0
        },
        lastDrawTime: 0
    },
    _pullNodes: function(stage) {
        var tempNodes = this.tempNodes;
        for(var n = 0; n < tempNodes.length; n++) {
            var node = tempNodes[n];
            if(node.getStage() !== undefined && node.getStage()._id === stage._id) {
                stage._addId(node);
                stage._addName(node);
                this.tempNodes.splice(n, 1);
                n -= 1;
            }
        }
    }
};

Kinetic.Type = {
    _isElement: function(obj) {
        return !!(obj && obj.nodeType == 1);
    },
    _isFunction: function(obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    },
    _isArray: function(obj) {
        return Object.prototype.toString.call(obj) == '[object Array]';
    },
    _isObject: function(obj) {
        return (!!obj && obj.constructor == Object);
    },
    _isNumber: function(obj) {
        return Object.prototype.toString.call(obj) == '[object Number]';
    },
    _hasMethods: function(obj) {
        var names = [];
        for(var key in obj) {
            if(this._isFunction(obj[key]))
                names.push(key);
        }
        return names.length > 0;
    },
    _getXY: function(arg) {
        if(this._isNumber(arg)) {
            return {
                x: arg,
                y: arg
            };
        }
        else if(this._isArray(arg)) {
            if(arg.length === 1) {
                var val = arg[0];
                if(this._isNumber(val)) {
                    return {
                        x: val,
                        y: val
                    };
                }else if(this._isArray(val)) {
                    return {
                        x: val[0],
                        y: val[1]
                    };
                }else if(this._isObject(val)) {
                    return val;
                }
            }else if(arg.length >= 2) {
                return {
                    x: arg[0],
                    y: arg[1]
                };
            }
        }else if(this._isObject(arg)) {
            return arg;
        }

        return {
            x: 0,
            y: 0
        };
    },
    _getSize: function(arg) {
        if(this._isNumber(arg)) {
            return {
                width: arg,
                height: arg
            };
        }else if(this._isArray(arg)) {
            if(arg.length === 1) {
                var val = arg[0];
                if(this._isNumber(val)) {
                    return {
                        width: val,
                        height: val
                    };
                }else if(this._isArray(val)) {
                    if(val.length >= 4) {
                        return {
                            width: val[2],
                            height: val[3]
                        };
                    }else if(val.length >= 2) {
                        return {
                            width: val[0],
                            height: val[1]
                        };
                    }
                }else if(this._isObject(val)) {
                    return val;
                }
            }else if(arg.length >= 4) {
                return {
                    width: arg[2],
                    height: arg[3]
                };
            }else if(arg.length >= 2) {
                return {
                    width: arg[0],
                    height: arg[1]
                };
            }
        }else if(this._isObject(arg)) {
            return arg;
        }

        return {
            width: 0,
            height: 0
        };
    },
    _getPoints: function(arg) {
        if(arg === undefined) {
            return [];
        }
        if(this._isObject(arg[0])) {
            return arg;
        }else {
            var arr = [];
            for(var n = 0; n < arg.length; n += 2) {
                arr.push({
                    x: arg[n],
                    y: arg[n + 1]
                });
            }

            return arr;
        }
    }
};


(function() {
    var initializing = false, fnTest = /xyz/.test(function() { xyz;
    }) ? /\b_super\b/ : /.*/;
    // The base Class implementation (does nothing)
    Kinetic.Class = function() {
    };
    // Create a new Class that inherits from this class
    Kinetic.Class.extend = function(prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for(var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn) {
                return function() {
                    var tmp = this._super;

                    // Add a new ._super() method that is the same method
                    // but on the super-class
                    this._super = _super[name];

                    // The method only need to be bound temporarily, so we
                    // remove it when we're done executing
                    var ret = fn.apply(this, arguments);
                    this._super = tmp;

                    return ret;
                };
            })(name, prop[name]) : prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if(!initializing && this.init)
                this.init.apply(this, arguments);
        }
        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;

        return Class;
    };
})();

Kinetic.Node = Kinetic.Class.extend({
    init: function(config) {
        this.defaultNodeAttrs = {
            visible: true,
            listening: true,
            name: undefined,
            alpha: 1,
            x: 0,
            y: 0,
            scale: {
                x: 1,
                y: 1
            },
            rotation: 0,
            offset: {
                x: 0,
                y: 0
            },
            dragConstraint: 'none',
            dragBounds: {},
            draggable: false
        };

        this.setDefaultAttrs(this.defaultNodeAttrs);
        this.eventListeners = {};
        this.setAttrs(config);

        this.on('draggableChange.kinetic', function() {
            if(this.attrs.draggable) {
                this._listenDrag();
            }else {
                this._dragCleanup();
                var stage = this.getStage();
                var go = Kinetic.Global;
                if(stage && go.drag.node && go.drag.node._id === this._id) {
                    stage._endDrag();
                }
            }
        });
        this.simulate('draggableChange');
    },
    on: function(typesStr, handler) {
        var types = typesStr.split(' ');
        for(var n = 0; n < types.length; n++) {
            var type = types[n];
            var event = type;
            var parts = event.split('.');
            var baseEvent = parts[0];
            var name = parts.length > 1 ? parts[1] : '';
            if(!this.eventListeners[baseEvent]) {
                this.eventListeners[baseEvent] = [];
            }
            this.eventListeners[baseEvent].push({
                name: name,
                handler: handler
            });
        }
    },
    off: function(typesStr) {
        var types = typesStr.split(' ');

        for(var n = 0; n < types.length; n++) {
            var type = types[n];
            var event = type;
            var parts = event.split('.');
            var baseEvent = parts[0];

            if(this.eventListeners[baseEvent] && parts.length > 1) {
                var name = parts[1];

                for(var i = 0; i < this.eventListeners[baseEvent].length; i++) {
                    if(this.eventListeners[baseEvent][i].name === name) {
                        this.eventListeners[baseEvent].splice(i, 1);
                        if(this.eventListeners[baseEvent].length === 0) {
                            delete this.eventListeners[baseEvent];
                            break;
                        }
                        i--;
                    }
                }
            }
            else {
                delete this.eventListeners[baseEvent];
            }
        }
    },
    getAttrs: function() {
        return this.attrs;
    },
    setDefaultAttrs: function(config) {
        if(this.attrs === undefined) {
            this.attrs = {};
        }
        if(config) {
            for(var key in config) {
                if(this.attrs[key] === undefined) {
                    this.attrs[key] = config[key];
                }
            }
        }
    },
    setAttrs: function(config) {
        var type = Kinetic.Type;
        var that = this;
        if(config !== undefined) {
            function setAttrs(obj, c, level) {
                for(var key in c) {
                    var val = c[key];
                    if(obj[key] === undefined && val !== undefined) {
                        obj[key] = {};
                    }
                    if(type._isObject(val) && !type._isArray(val) && !type._isElement(val) && !type._hasMethods(val)) {
                        if(!Kinetic.Type._isObject(obj[key])) {
                            obj[key] = {};
                        }

                        setAttrs(obj[key], val, level + 1);
                    }else {
                        switch (key) {
                            case 'rotationDeg':
                                that._setAttr(obj, 'rotation', c[key] * Math.PI / 180);
                                key = 'rotation';
                                break;
                            case 'offset':
                                var pos = type._getXY(val);
                                that._setAttr(obj[key], 'x', pos.x);
                                that._setAttr(obj[key], 'y', pos.y);
                                break;
                            case 'scale':
                                var pos = type._getXY(val);
                                that._setAttr(obj[key], 'x', pos.x);
                                that._setAttr(obj[key], 'y', pos.y);
                                break;
                            case 'points':
                                that._setAttr(obj, key, type._getPoints(val));
                                break;
                            case 'crop':
                                var pos = type._getXY(val);
                                var size = type._getSize(val);
                                that._setAttr(obj[key], 'x', pos.x);
                                that._setAttr(obj[key], 'y', pos.y);
                                that._setAttr(obj[key], 'width', size.width);
                                that._setAttr(obj[key], 'height', size.height);
                                break;
                            default:
                                that._setAttr(obj, key, val);
                                break;
                        }
                    }
                    if(level === 0) {
                        that._fireChangeEvent(key);
                    }
                }
            }
            setAttrs(this.attrs, config, 0);
        }
    },
    isVisible: function() {
        if(this.attrs.visible && this.getParent() && !this.getParent().isVisible()) {
            return false;
        }
        return this.attrs.visible;
    },
    show: function() {
        this.setAttrs({
            visible: true
        });
    },
    hide: function() {
        this.setAttrs({
            visible: false
        });
    },
    getZIndex: function() {
        return this.index;
    },
    getAbsoluteZIndex: function() {
        var level = this.getLevel();
        var stage = this.getStage();
        var that = this;
        var index = 0;
        function addChildren(children) {
            var nodes = [];
            for(var n = 0; n < children.length; n++) {
                var child = children[n];
                index++;

                if(child.nodeType !== 'Shape') {
                    nodes = nodes.concat(child.getChildren());
                }

                if(child._id === that._id) {
                    n = children.length;
                }
            }

            if(nodes.length > 0 && nodes[0].getLevel() <= level) {
                addChildren(nodes);
            }
        }
        if(that.nodeType !== 'Stage') {
            addChildren(that.getStage().getChildren());
        }

        return index;
    },
    getLevel: function() {
        var level = 0;
        var parent = this.parent;
        while(parent) {
            level++;
            parent = parent.parent;
        }
        return level;
    },
    setPosition: function() {
        var pos = Kinetic.Type._getXY(Array.prototype.slice.call(arguments));
        this.setAttrs(pos);
    },
    getPosition: function() {
        return {
            x: this.attrs.x,
            y: this.attrs.y
        };
    },
    getAbsolutePosition: function() {
        return this.getAbsoluteTransform().getTranslation();
    },
    setAbsolutePosition: function() {
        var pos = Kinetic.Type._getXY(Array.prototype.slice.call(arguments));
        var rot = this.attrs.rotation;
        var scale = {
            x: this.attrs.scale.x,
            y: this.attrs.scale.y
        };
        var offset = {
            x: this.attrs.offset.x,
            y: this.attrs.offset.y
        };

        this.attrs.rotation = 0;
        this.attrs.scale = {
            x: 1,
            y: 1
        };

        var it = this.getAbsoluteTransform();
        it.invert();
        it.translate(pos.x, pos.y);
        pos = {
            x: this.attrs.x + it.getTranslation().x,
            y: this.attrs.y + it.getTranslation().y
        };

        this.setPosition(pos.x, pos.y);
        this.rotate(rot);
        this.attrs.scale = {
            x: scale.x,
            y: scale.y
        };
    },
    move: function() {
        var pos = Kinetic.Type._getXY(Array.prototype.slice.call(arguments));

        var x = this.getX();
        var y = this.getY();

        if(pos.x !== undefined) {
            x += pos.x;
        }

        if(pos.y !== undefined) {
            y += pos.y;
        }

        this.setAttrs({
            x: x,
            y: y
        });
    },
    getRotationDeg: function() {
        return this.attrs.rotation * 180 / Math.PI;
    },
    rotate: function(theta) {
        this.setAttrs({
            rotation: this.getRotation() + theta
        });
    },
    rotateDeg: function(deg) {
        this.setAttrs({
            rotation: this.getRotation() + (deg * Math.PI / 180)
        });
    },
    moveToTop: function() {
        var index = this.index;
        this.parent.children.splice(index, 1);
        this.parent.children.push(this);
        this.parent._setChildrenIndices();
    },
    moveUp: function() {
        var index = this.index;
        this.parent.children.splice(index, 1);
        this.parent.children.splice(index + 1, 0, this);
        this.parent._setChildrenIndices();
    },
    moveDown: function() {
        var index = this.index;
        if(index > 0) {
            this.parent.children.splice(index, 1);
            this.parent.children.splice(index - 1, 0, this);
            this.parent._setChildrenIndices();
        }
    },
    moveToBottom: function() {
        var index = this.index;
        this.parent.children.splice(index, 1);
        this.parent.children.unshift(this);
        this.parent._setChildrenIndices();
    },
    setZIndex: function(zIndex) {
        var index = this.index;
        this.parent.children.splice(index, 1);
        this.parent.children.splice(zIndex, 0, this);
        this.parent._setChildrenIndices();
    },
    getAbsoluteAlpha: function() {
        var absAlpha = 1;
        var node = this;
        while(node.nodeType !== 'Stage') {
            absAlpha *= node.attrs.alpha;
            node = node.parent;
        }
        return absAlpha;
    },
    isDragging: function() {
        var go = Kinetic.Global;
        return go.drag.node !== undefined && go.drag.node._id === this._id && go.drag.moving;
    },
    moveTo: function(newContainer) {
        var parent = this.parent;
        parent.children.splice(this.index, 1);
        parent._setChildrenIndices();

        newContainer.children.push(this);
        this.index = newContainer.children.length - 1;
        this.parent = newContainer;
        newContainer._setChildrenIndices();
    },
    getParent: function() {
        return this.parent;
    },
    getLayer: function() {
        if(this.nodeType === 'Layer') {
            return this;
        }
        else {
            return this.getParent().getLayer();
        }
    },
    getStage: function() {
        if(this.nodeType !== 'Stage' && this.getParent()) {
            return this.getParent().getStage();
        }
        else if(this.nodeType === 'Stage') {
            return this;
        }
        else {
            return undefined;
        }
    },
    simulate: function(eventType) {
        this._handleEvent(eventType, {});
    },
    getAbsoluteTransform: function() {
        var am = new Kinetic.Transform();

        var family = [];
        var parent = this.parent;

        family.unshift(this);
        while(parent) {
            family.unshift(parent);
            parent = parent.parent;
        }

        for(var n = 0; n < family.length; n++) {
            var node = family[n];
            var m = node.getTransform();

            am.multiply(m);
        }

        return am;
    },
    getTransform: function() {
        var m = new Kinetic.Transform();

        if(this.attrs.x !== 0 || this.attrs.y !== 0) {
            m.translate(this.attrs.x, this.attrs.y);
        }
        if(this.attrs.rotation !== 0) {
            m.rotate(this.attrs.rotation);
        }
        if(this.attrs.scale.x !== 1 || this.attrs.scale.y !== 1) {
            m.scale(this.attrs.scale.x, this.attrs.scale.y);
        }

        return m;
    },
    clone: function(obj) {
        var classType = this.shapeType || this.nodeType;
        var node = new Kinetic[classType](this.attrs);

        for(var key in this.eventListeners) {
            var allListeners = this.eventListeners[key];
            for(var n = 0; n < allListeners.length; n++) {
                var listener = allListeners[n];
                if(listener.name.indexOf('kinetic') < 0) {
                    if(!node.eventListeners[key]) {
                        node.eventListeners[key] = [];
                    }
                    node.eventListeners[key].push(listener);
                }
            }
        }

        node.setAttrs(obj);
        return node;
    },
    _fireChangeEvent: function(attr) {
        this._handleEvent(attr + 'Change', {});
    },
    _setAttr: function(obj, attr, val) {
        if(val !== undefined) {
            if(obj === undefined) {
                obj = {};
            }
            obj[attr] = val;
        }
    },
    _listenDrag: function() {
        this._dragCleanup();
        var go = Kinetic.Global;
        var that = this;
        this.on('mousedown.kinetic', function(evt) {
            if(evt.button !=2){
                that._initDrag();
            }
        });
    },
    _initDrag: function() {
        var go = Kinetic.Global;
        var stage = this.getStage();
        var pos = stage.getUserPosition();

        if(pos) {
            var m = this.getTransform().getTranslation();
            var am = this.getAbsoluteTransform().getTranslation();
            go.drag.node = this;
            go.drag.offset.x = pos.x - this.getAbsoluteTransform().getTranslation().x;
            go.drag.offset.y = pos.y - this.getAbsoluteTransform().getTranslation().y;
        }
    },
    _dragCleanup: function() {
        this.off('mousedown.kinetic');
    },
    _handleEvent: function(eventType, evt) {
        if(this.nodeType === 'Shape') {
            evt.shape = this;
        }

        var stage = this.getStage();
        var mover = stage ? stage.mouseoverShape : null;
        var mout = stage ? stage.mouseoutShape : null;
        var el = this.eventListeners;
        var okayToRun = true;

        if(eventType === 'mouseover' && mout && mout._id === this._id) {
            okayToRun = false;
        }
        else if(eventType === 'mouseout' && mover && mover._id === this._id) {
            okayToRun = false;
        }

        if(okayToRun) {
            if(el[eventType]) {
                var events = el[eventType];
                for(var i = 0; i < events.length; i++) {
                    events[i].handler.apply(this, [evt]);
                }
            }

            if(stage && mover && mout) {
                stage.mouseoverShape = mover.parent;
                stage.mouseoutShape = mout.parent;
            }
            if(Kinetic.Global.BUBBLE_WHITELIST.indexOf(eventType) >= 0 && !evt.cancelBubble && this.parent) {
                this._handleEvent.call(this.parent, eventType, evt);
            }
        }
    }
});

Kinetic.Node.addSetters = function(constructor, arr) {
    for(var n = 0; n < arr.length; n++) {
        var attr = arr[n];
        this._addSetter(constructor, attr);
    }
};
Kinetic.Node.addGetters = function(constructor, arr) {
    for(var n = 0; n < arr.length; n++) {
        var attr = arr[n];
        this._addGetter(constructor, attr);
    }
};
Kinetic.Node.addGettersSetters = function(constructor, arr) {
    this.addSetters(constructor, arr);
    this.addGetters(constructor, arr);
};
Kinetic.Node._addSetter = function(constructor, attr) {
    var that = this;
    var method = 'set' + attr.charAt(0).toUpperCase() + attr.slice(1);
    constructor.prototype[method] = function() {
        var arg;
        if(arguments.length == 1) {
            arg = arguments[0];
        }
        else {
            arg = Array.prototype.slice.call(arguments);
        }
        var obj = {};
        obj[attr] = arg;
        this.setAttrs(obj);
    };
};
Kinetic.Node._addGetter = function(constructor, attr) {
    var that = this;
    var method = 'get' + attr.charAt(0).toUpperCase() + attr.slice(1);
    constructor.prototype[method] = function(arg) {
        return this.attrs[attr];
    };
};

Kinetic.Node.addGettersSetters(Kinetic.Node, ['x', 'y', 'scale', 'detectionType', 'rotation', 'alpha', 'name', 'id', 'offset', 'draggable', 'dragConstraint', 'dragBounds', 'listening']);
Kinetic.Node.addSetters(Kinetic.Node, ['rotationDeg']);


Kinetic.Container = Kinetic.Node.extend({
    init: function(config) {
        this.children = [];
        this._super(config);
    },
    getChildren: function() {
        return this.children;
    },
    removeChildren: function() {
        while(this.children.length > 0) {
            this.remove(this.children[0]);
        }
    },
    add: function(child) {
        child._id = Kinetic.Global.idCounter++;
        child.index = this.children.length;
        child.parent = this;
        this.children.push(child);
        var stage = child.getStage();
        if(stage === undefined) {
            var go = Kinetic.Global;
            go.tempNodes.push(child);
        }else {
            stage._addId(child);
            stage._addName(child);
            var go = Kinetic.Global;
            go._pullNodes(stage);
        }

        if(this._add !== undefined) {
            this._add(child);
        }

        return this;
    },
    remove: function(child) {
        if(child && child.index !== undefined && this.children[child.index]._id == child._id) {
            var stage = this.getStage();
            if(stage !== undefined) {
                stage._removeId(child);
                stage._removeName(child);
            }

            var go = Kinetic.Global;
            for(var n = 0; n < go.tempNodes.length; n++) {
                var node = go.tempNodes[n];
                if(node._id === child._id) {
                    go.tempNodes.splice(n, 1);
                    break;
                }
            }

            this.children.splice(child.index, 1);
            this._setChildrenIndices();

            while(child.children && child.children.length > 0) {
                child.remove(child.children[0]);
            }

            if(this._remove !== undefined) {
                this._remove(child);
            }
        }

        return this;
    },
    get: function(selector) {
        var stage = this.getStage();
        var arr;
        var key = selector.slice(1);
        if(selector.charAt(0) === '#') {
            arr = stage.ids[key] !== undefined ? [stage.ids[key]] : [];
        }
        else if(selector.charAt(0) === '.') {
            arr = stage.names[key] !== undefined ? stage.names[key] : [];
        }
        else if(selector === 'Shape' || selector === 'Group' || selector === 'Layer') {
            return this._getNodes(selector);
        }
        else {
            return false;
        }

        var retArr = [];
        for(var n = 0; n < arr.length; n++) {
            var node = arr[n];
            if(this.isAncestorOf(node)) {
                retArr.push(node);
            }
        }

        return retArr;
    },
    isAncestorOf: function(node) {
        if(this.nodeType === 'Stage') {
            return true;
        }

        var parent = node.getParent();
        while(parent) {
            if(parent._id === this._id) {
                return true;
            }
            parent = parent.getParent();
        }

        return false;
    },
    getIntersections: function() {
        var pos = Kinetic.Type._getXY(Array.prototype.slice.call(arguments));
        var arr = [];
        var shapes = this.get('Shape');

        for(var n = 0; n < shapes.length; n++) {
            var shape = shapes[n];
            if(shape.isVisible() && shape.intersects(pos)) {
                arr.push(shape);
            }
        }

        return arr;
    },
    _getNodes: function(sel) {
        var arr = [];
        function traverse(cont) {
            var children = cont.getChildren();
            for(var n = 0; n < children.length; n++) {
                var child = children[n];
                if(child.nodeType === sel) {
                    arr.push(child);
                }
                else if(child.nodeType !== 'Shape') {
                    traverse(child);
                }
            }
        }
        traverse(this);

        return arr;
    },
    _drawChildren: function() {
        var stage = this.getStage();
        var children = this.children;
        for(var n = 0; n < children.length; n++) {
            var child = children[n];
            if(child.nodeType === 'Shape') {
                if(child.isVisible() && stage.isVisible()) {
                    child._draw(child.getLayer());
                }
            }
            else {
                child.draw();
            }
        }
    },
    _setChildrenIndices: function() {
        if(this.nodeType === 'Stage') {
            var canvases = this.content.children;
            var bufferCanvas = canvases[0];
            var backstageCanvas = canvases[1];

            this.content.innerHTML = '';
            this.content.appendChild(bufferCanvas);
            this.content.appendChild(backstageCanvas);
        }

        for(var n = 0; n < this.children.length; n++) {
            this.children[n].index = n;

            if(this.nodeType === 'Stage') {
                this.content.appendChild(this.children[n].canvas);
            }
        }
    }
});

Kinetic.Stage = Kinetic.Container.extend({
    init: function(config) {
        this.setDefaultAttrs({
            width: 400,
            height: 200,
            throttle: 80
        });
        if( typeof config.container === 'string') {
            config.container = document.getElementById(config.container);
        }
        this._super(config);

        this._setStageDefaultProperties();
        this._id = Kinetic.Global.idCounter++;
        this._buildDOM();
        this._bindContentEvents();

        this.on('widthChange.kinetic', function() {
            this._resizeDOM();
        });

        this.on('heightChange.kinetic', function() {
            this._resizeDOM();
        });
        var go = Kinetic.Global;
        go.stages.push(this);
        this._addId(this);
        this._addName(this);
    },
    draw: function() {
        this._drawChildren();
    },
    setSize: function() {
        var size = Kinetic.Type._getSize(Array.prototype.slice.call(arguments));
        this.setAttrs(size);
    },
    getSize: function() {
        return {
            width: this.attrs.width,
            height: this.attrs.height
        };
    },
    clear: function() {
        var layers = this.children;
        for(var n = 0; n < layers.length; n++) {
            layers[n].clear();
        }
    },
    toDataURL: function(callback, mimeType, quality) {
        var bufferLayer = this.bufferLayer;
        var bufferContext = bufferLayer.getContext();
        var layers = this.children;
        var that = this;

        function addLayer(n) {
            var dataURL = layers[n].getCanvas().toDataURL();
            var imageObj = new Image();
            imageObj.onload = function() {
                bufferContext.drawImage(this, 0, 0);
                n++;
                if(n < layers.length) {
                    addLayer(n);
                }
                else {
                    try {
                        callback(bufferLayer.getCanvas().toDataURL(mimeType, quality));
                    }
                    catch(exception) {
                        callback(bufferLayer.getCanvas().toDataURL());
                    }
                }
            };
            imageObj.src = dataURL;
        }

        bufferLayer.clear();
        addLayer(0);
    },
    toJSON: function() {
        var type = Kinetic.Type;
        function addNode(node) {
            var obj = {};
            obj.attrs = {};
            for(var key in node.attrs) {
                var val = node.attrs[key];
                if(!type._isFunction(val) && !type._isElement(val) && !type._hasMethods(val)) {
                    obj.attrs[key] = val;
                }
            }

            obj.nodeType = node.nodeType;
            obj.shapeType = node.shapeType;

            if(node.nodeType !== 'Shape') {
                obj.children = [];

                var children = node.getChildren();
                for(var n = 0; n < children.length; n++) {
                    var child = children[n];
                    obj.children.push(addNode(child));
                }
            }

            return obj;
        }
        return JSON.stringify(addNode(this));
    },
    reset: function() {
        this.removeChildren();
        this._setStageDefaultProperties();
        this.setAttrs(this.defaultNodeAttrs);
    },
    load: function(json) {
        this.reset();
        function loadNode(node, obj) {
            var children = obj.children;
            if(children !== undefined) {
                for(var n = 0; n < children.length; n++) {
                    var child = children[n];
                    var type;
                    if(child.nodeType === 'Shape') {
                        if(child.shapeType === undefined) {
                            type = 'Shape';
                        }else {
                            type = child.shapeType;
                        }
                    }else {
                        type = child.nodeType;
                    }

                    var no = new Kinetic[type](child.attrs);
                    node.add(no);
                    loadNode(no, child);
                }
            }
        }
        var obj = JSON.parse(json);
        this.attrs = obj.attrs;

        loadNode(this, obj);
        this.draw();
    },
    getMousePosition: function(evt) {
        return this.mousePos;
    },
    getUserPosition: function(evt) {
        return this.getMousePosition();
    },
    getContainer: function() {
        return this.attrs.container;
    },
    getContent: function() {
        return this.content;
    },
    getStage: function() {
        return this;
    },
    getDOM: function() {
        return this.content;
    },
    _resizeDOM: function() {
        var width = this.attrs.width;
        var height = this.attrs.height;
        this.content.style.width = width + 'px';
        this.content.style.height = height + 'px';
        this.bufferLayer.getCanvas().width = width;
        this.bufferLayer.getCanvas().height = height;
        this.pathLayer.getCanvas().width = width;
        this.pathLayer.getCanvas().height = height;
        var layers = this.children;
        for(var n = 0; n < layers.length; n++) {
            var layer = layers[n];
            layer.getCanvas().width = width;
            layer.getCanvas().height = height;
            layer.draw();
        }
    },
    _remove: function(layer) {
        try {
            this.content.removeChild(layer.canvas);
        }
        catch(e) {
        }
    },
    _add: function(layer) {
        layer.canvas.width = this.attrs.width;
        layer.canvas.height = this.attrs.height;
        layer.draw();
        this.content.appendChild(layer.canvas);
        layer.lastDrawTime = 0;
    },
    _detectEvent: function(shape, evt) {
        var isDragging = Kinetic.Global.drag.moving;
        var go = Kinetic.Global;
        var pos = this.getUserPosition();
        var el = shape.eventListeners;
        var that = this;

        if(this.targetShape && shape._id === this.targetShape._id) {
            this.targetFound = true;
        }

        if(shape.isVisible() && pos !== undefined && shape.intersects(pos)) {
            if(!isDragging && this.mouseDown) {
                this.mouseDown = false;
                this.clickStart = true;
                shape._handleEvent('mousedown', evt);
                return true;
            }else if(this.mouseUp) {
                this.mouseUp = false;
                shape._handleEvent('mouseup', evt);
                if(this.clickStart) {
                    if((!go.drag.moving) || !go.drag.node) {
                        shape._handleEvent('click', evt);
                        if(this.inDoubleClickWindow && evt.button !=2) {
                            shape._handleEvent('dblclick', evt);
                        }
                        this.inDoubleClickWindow = true;
                        setTimeout(function() {
                            that.inDoubleClickWindow = false;
                        }, this.dblClickWindow);
                    }
                }
                return true;
            }else if(!isDragging && this._isNewTarget(shape, evt)) {
                if(this.mouseoutShape) {
                    this.mouseoverShape = shape;
                    this.mouseoutShape._handleEvent('mouseout', evt);
                    this.mouseoverShape = undefined;
                }

                shape._handleEvent('mouseover', evt);
                this._setTarget(shape);
                return true;
            }else {
                if(!isDragging && this.mouseMove) {
                    shape._handleEvent('mousemove', evt);
                    return true;
                }
            }

        }else if(!isDragging && this.targetShape && this.targetShape._id === shape._id) {
            this._setTarget(undefined);
            this.mouseoutShape = shape;
            this.mouseoutShape._handleEvent('mouseout', evt);
            this.mouseoutShape = undefined;
            
            return true;
        }

        return false;
    },
    _setTarget: function(shape) {
        this.targetShape = shape;
        this.targetFound = true;
    },
    _isNewTarget: function(shape, evt) {
        if(!this.targetShape || (!this.targetFound && shape._id !== this.targetShape._id)) {
            if(this.targetShape) {
                var oldEl = this.targetShape.eventListeners;
                if(oldEl) {
                    this.mouseoutShape = this.targetShape;
                }
            }
            return true;
        }
        else {
            return false;
        }
    },
    _traverseChildren: function(obj, evt) {
        var children = obj.children;
        for(var i = children.length - 1; i >= 0; i--) {
            var child = children[i];
            if(child.getListening()) {
                if(child.nodeType === 'Shape') {
                    var exit = this._detectEvent(child, evt);
                    if(exit) {
                        return true;
                    }
                }else {
                    var exit = this._traverseChildren(child, evt);
                    if(exit) {
                        return true;
                    }
                }
            }
        }

        return false;
    },
    _handleStageEvent: function(evt) {
        var date = new Date();
        var time = date.getTime();
        this.lastEventTime = time;

        var go = Kinetic.Global;
        if(!evt) {
            evt = window.event;
        }

        this._setMousePosition(evt);
        this.pathLayer.clear();
        
        this.targetFound = false;
        var shapeDetected = false;
        for(var n = this.children.length - 1; n >= 0; n--) {
            var layer = this.children[n];
            if(layer.isVisible() && n >= 0 && layer.getListening()) {
                if(this._traverseChildren(layer, evt)) {
                    shapeDetected = true;
                    break;
                }
            }
        }

        if(!shapeDetected && this.mouseoutShape) {
            this.mouseoutShape._handleEvent('mouseout', evt);
            this.mouseoutShape = undefined;
        }
    },
    _bindContentEvents: function() {
        var go = Kinetic.Global;
        var that = this;

        var events = ['mousedown', 'mousemove', 'mouseup', 'mouseover', 'mouseout'];

        for(var n = 0; n < events.length; n++) {
            var pubEvent = events[n];
            ( function() {
                var event = pubEvent;
                that.content.addEventListener(event, function(evt) {
                    that['_' + event](evt);
                }, false);
            }());
        }
    },
    _mouseover: function(evt) {
        this._handleStageEvent(evt);
    },
    _mouseout: function(evt) {
        var targetShape = this.targetShape;
        if(targetShape) {
            targetShape._handleEvent('mouseout', evt);
            this.targetShape = undefined;
        }
        
        var isDraggging = Kinetic.Global.drag.moving;
        if(isDraggging){
            var attrs = this.attrs,
                data = this.data,
                con = attrs.container,
                w = attrs.width + con.offsetLeft - document.body.scrollLeft - document.documentElement.scrollLeft,
                h = attrs.height + con.offsetTop - document.body.scrollTop - document.documentElement.scrollTop,
                canvas = data.layer.canvas,
                battrs = data.bg.attrs;

            if(evt.clientX > w ){
                canvas.width += 200;///////////////////////////////////////////////////////////////////////////////////////////
                battrs.width += 200;
                //gData.bgLayer.canvas.width += 200;
            }else if(evt.clientY > h){
                canvas.height += 200;
                //gData.bgLayer.canvas.height += 200;
                battrs.height += 200;
            }
            data.layer.draw();
            //gData.bgLayer.draw();
        }
        this.mousePos = undefined;
        //this._endDrag(evt);
    },
    _mousemove: function(evt) {
        var throttle = this.attrs.throttle;
        var date = new Date();
        var time = date.getTime();
        var timeDiff = time - this.lastEventTime;
        var tt = 1000 / throttle;

        if(timeDiff >= tt || throttle > 200) {
            this.mouseDown = false;
            this.mouseUp = false;
            this.mouseMove = true;
            this._handleStageEvent(evt);
        }
 
        var data = this.data,
            line = data.line,
            anchors = line.anchors;
                            
        if(!line.flag && anchors){

            var attrs = anchors[2].attrs,
                pos = this.mousePos;
            
            attrs.x = pos.x;
            attrs.y = pos.y;

            anchors[2].dragmove(anchors[2], evt);
            data.layer.draw();
            return;
        }


        this._startDrag(evt);
    },
    _mousedown: function(evt) {
        this.mouseDown = true;
        this.mouseUp = false;
        this.mouseMove = false;
        this._handleStageEvent(evt);

        if(this.attrs.draggable) {
            this._initDrag();
        }
    },
    _mouseup: function(evt) {
        this.mouseDown = false;
        this.mouseUp = true;
        this.mouseMove = false;
        this._handleStageEvent(evt);
        this.clickStart = false;
        
        
        var line = this.data.line;
        if(!line.flag){ 
            line.flag = true;
            if(line.src){
                line.src.attrs.dragBounds = {};
            }
            line.toDrawLine = false;

            //update anchor[2]
            var anchors = line.anchors,
                curve = anchors[2].curve,
                point = curve.dash.attrs.points[1];

            anchors[2].dragend(anchors[2], evt);
            
            anchors[1].attrs.x = (anchors[0].attrs.x + anchors[2].attrs.x) >> 1;
            anchors[1].attrs.y = (anchors[0].attrs.y + anchors[2].attrs.y) >> 1;

            point.x = anchors[1].attrs.x;
            point.y = anchors[1].attrs.y;

            anchors[1].show();

            this.data.lines[curve.dash._id] = curve;
            anchors[0].getLayer().draw();
            
            line.src = null;
            line.anchors = null;

        }
        
        this._endDrag(evt);
    },
    _setMousePosition: function(evt) {
        var con = this.attrs.container;
        var mouseX = evt.clientX - this._getContentPosition().left + window.pageXOffset + con.scrollLeft;
        var mouseY = evt.clientY - this._getContentPosition().top + window.pageYOffset + con.scrollTop;
        this.mousePos = {
            x: mouseX,
            y: mouseY
        };
    },
    _getContentPosition: function() {
        var obj = this.content;
        var top = 0;
        var left = 0;
        while(obj && obj.tagName !== 'BODY') {
            top += obj.offsetTop - obj.scrollTop;
            left += obj.offsetLeft - obj.scrollLeft;
            obj = obj.offsetParent;
        }
        return {
            top: top,
            left: left
        };
    },
    _modifyPathContext: function(context) {
        context.stroke = function() {
        };
        context.fill = function() {
        };
        context.fillRect = function(x, y, width, height) {
            context.rect(x, y, width, height);
        };
        context.strokeRect = function(x, y, width, height) {
            context.rect(x, y, width, height);
        };
        context.drawImage = function() {
        };
        context.fillText = function() {
        };
        context.strokeText = function() {
        };
    },
    _endDrag: function(evt) {
        var go = Kinetic.Global;
        if(go.drag.node) {
            if(go.drag.moving) {
                go.drag.moving = false;
                go.drag.node._handleEvent('dragend', evt);
            }
        }
        go.drag.node = undefined;
    },
    _startDrag: function(evt) {
        var that = this;
        var go = Kinetic.Global;
        var node = go.drag.node;

        if(node) {
            var pos = that.getUserPosition();
            var dc = node.attrs.dragConstraint;
            var db = node.attrs.dragBounds;
            var lastNodePos = {
                x: node.attrs.x,
                y: node.attrs.y
            };

            var newNodePos = {
                x: pos.x - go.drag.offset.x,
                y: pos.y - go.drag.offset.y
            };
            if(db.left !== undefined && newNodePos.x < db.left) {
                newNodePos.x = db.left;
            }
            if(db.right !== undefined && newNodePos.x > db.right) {
                newNodePos.x = db.right;
            }
            if(db.top !== undefined && newNodePos.y < db.top) {
                newNodePos.y = db.top;
            }
            if(db.bottom !== undefined && newNodePos.y > db.bottom) {
                newNodePos.y = db.bottom;
            }

            node.setAbsolutePosition(newNodePos);

            if(dc === 'horizontal') {
                node.attrs.y = lastNodePos.y;
            }
            else if(dc === 'vertical') {
                node.attrs.x = lastNodePos.x;
            }

            if(go.drag.node.nodeType === 'Stage') {
                go.drag.node.draw();
            }

            else {
                go.drag.node.getLayer().draw();
            }

            if(!go.drag.moving) {
                go.drag.moving = true;
                go.drag.node._handleEvent('dragstart', evt);
            }
            go.drag.node._handleEvent('dragmove', evt);
        }
    },
    _buildDOM: function() {
        this.content = document.createElement('div');
        this.content.style.position = 'relative';
        this.content.style.display = 'inline-block';
        this.content.className = 'kineticjs-content';
        this.attrs.container.appendChild(this.content);
        this.bufferLayer = new Kinetic.Layer({
            name: 'bufferLayer'
        });
        this.pathLayer = new Kinetic.Layer({
            name: 'pathLayer'
        });
        this.bufferLayer.parent = this;
        this.pathLayer.parent = this;
        this._modifyPathContext(this.pathLayer.context);
        this.bufferLayer.getCanvas().style.display = 'none';
        this.pathLayer.getCanvas().style.display = 'none';
        this.bufferLayer.canvas.className = 'kineticjs-buffer-layer';
        this.content.appendChild(this.bufferLayer.canvas);
        this.pathLayer.canvas.className = 'kineticjs-path-layer';
        this.content.appendChild(this.pathLayer.canvas);

        this.setSize(this.attrs.width, this.attrs.height);
        this._resizeDOM();
    },
    _addId: function(node) {
        if(node.attrs.id !== undefined) {
            this.ids[node.attrs.id] = node;
        }
    },
    _removeId: function(node) {
        if(node.attrs.id !== undefined) {
            delete this.ids[node.attrs.id];
        }
    },
    _addName: function(node) {
        var name = node.attrs.name;
        if(name !== undefined) {
            if(this.names[name] === undefined) {
                this.names[name] = [];
            }
            this.names[name].push(node);
        }
    },
    _removeName: function(node) {
        if(node.attrs.name !== undefined) {
            var nodes = this.names[node.attrs.name];
            if(nodes !== undefined) {
                for(var n = 0; n < nodes.length; n++) {
                    var no = nodes[n];
                    if(no._id === node._id) {
                        nodes.splice(n, 1);
                    }
                }
                if(nodes.length === 0) {
                    delete this.names[node.attrs.name];
                }
            }
        }
    },
    _onContent: function(typesStr, handler) {
        var types = typesStr.split(' ');
        for(var n = 0; n < types.length; n++) {
            var baseEvent = types[n];
            this.content.addEventListener(baseEvent, handler, false);
        }
    },
    _setStageDefaultProperties: function() {
        this.nodeType = 'Stage';
        this.lastEventTime = 0;
        this.dblClickWindow = 400;
        this.targetShape = undefined;
        this.targetFound = false;
        this.mouseoverShape = undefined;
        this.mouseoutShape = undefined;

        this.mousePos = undefined;
        this.mouseDown = false;
        this.mouseUp = false;
        this.mouseMove = false;
        this.clickStart = false;

        this.ids = {};
        this.names = {};
    }
});

Kinetic.Node.addGettersSetters(Kinetic.Stage, ['width', 'height', 'throttle']);

Kinetic.Layer = Kinetic.Container.extend({
    init: function(config) {
        this.setDefaultAttrs({
            throttle: 80,
            clearBeforeDraw: true
        });

        this.nodeType = 'Layer';
        this.lastDrawTime = 0;
        this.beforeDrawFunc = undefined;
        this.afterDrawFunc = undefined;

        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.style.position = 'absolute';
        this._super(config);
    },
    draw: function() {
        var throttle = this.attrs.throttle;
        var date = new Date();
        var time = date.getTime();
        var timeDiff = time - this.lastDrawTime;
        var tt = 1000 / throttle;

        if(timeDiff >= tt || throttle > 200) {
            this._draw();

            if(this.drawTimeout !== undefined) {
                clearTimeout(this.drawTimeout);
                this.drawTimeout = undefined;
            }
        }else if(this.drawTimeout === undefined) {
            var that = this;
            this.drawTimeout = setTimeout(function() {
                that.draw();
            }, 17);
        }
    },
    beforeDraw: function(func) {
        this.beforeDrawFunc = func;
    },
    afterDraw: function(func) {
        this.afterDrawFunc = func;
    },
    clear: function() {
        var context = this.getContext();
        var canvas = this.getCanvas();
        context.clearRect(0, 0, canvas.width, canvas.height);
    },
    getCanvas: function() {
        return this.canvas;
    },
    getContext: function() {
        return this.context;
    },
    _draw: function() {
        var date = new Date();
        var time = date.getTime();
        this.lastDrawTime = time;
        if(this.beforeDrawFunc !== undefined) {
            this.beforeDrawFunc.call(this);
        }

        if(this.attrs.clearBeforeDraw) {
            this.clear();
        }

        if(this.isVisible()) {
            if(this.attrs.drawFunc !== undefined) {
                this.attrs.drawFunc.call(this);
            }
            this._drawChildren();
        }

        if(this.afterDrawFunc !== undefined) {
            this.afterDrawFunc.call(this);
        }
    }
});

Kinetic.Node.addGettersSetters(Kinetic.Layer, ['clearBeforeDraw', 'throttle']);

Kinetic.Group = Kinetic.Container.extend({
    init: function(config) {
        this.nodeType = 'Group';

        // call super constructor
        this._super(config);
    },
    draw: function() {
        if(this.attrs.visible) {
            this._drawChildren();
        }
    }
});

Kinetic.Shape = Kinetic.Node.extend({
    init: function(config) {
        this.setDefaultAttrs({
            detectionType: 'path'
        });

        this.data = [];
        this.nodeType = 'Shape';
        this.appliedShadow = false;
        this._super(config);
    },
    getContext: function() {
        return this.tempLayer.getContext();
    },
    getCanvas: function() {
        return this.tempLayer.getCanvas();
    },
    stroke: function() {
        var go = Kinetic.Global;
        var appliedShadow = false;
        var context = this.getContext();

        if(this.attrs.stroke || this.attrs.strokeWidth) {
            context.save();
            if(this.attrs.shadow && !this.appliedShadow) {
                appliedShadow = this._applyShadow();
            }

            var stroke = this.attrs.stroke ? this.attrs.stroke : 'black';
            var strokeWidth = this.attrs.strokeWidth ? this.attrs.strokeWidth : 2;
            
            context.lineWidth = strokeWidth;
            context.strokeStyle = stroke;
            context.stroke();
            context.restore();
        }

        if(appliedShadow) {
            this.stroke();
        }
    },
    fill: function() {
        var appliedShadow = false;
        var context = this.getContext();
        context.save();

        var fill = this.attrs.fill;

        if(fill) {
            if(this.attrs.shadow && !this.appliedShadow) {
                appliedShadow = this._applyShadow();
            }

            var s = fill.start;
            var e = fill.end;
            var f = null;

            if( typeof fill == 'string') {
                f = this.attrs.fill;
                context.fillStyle = f;
                context.fill();
            }else if(fill.image) {
                var repeat = !fill.repeat ? 'repeat' : fill.repeat;
                f = context.createPattern(fill.image, repeat);

                context.save();

                if(fill.scale) {
                    context.scale(fill.scale.x, fill.scale.y);
                }
                if(fill.offset) {
                    context.translate(fill.offset.x, fill.offset.y);
                }

                context.fillStyle = f;
                context.fill();
                context.restore();
            }else if(!s.radius && !e.radius) {
                var context = this.getContext();
                var grd = context.createLinearGradient(s.x, s.y, e.x, e.y);
                var colorStops = fill.colorStops;

                for(var n = 0; n < colorStops.length; n += 2) {
                    grd.addColorStop(colorStops[n], colorStops[n + 1]);
                }
                f = grd;
                context.fillStyle = f;
                context.fill();
            }else if((s.radius || s.radius === 0) && (e.radius || e.radius === 0)) {
                var context = this.getContext();
                var grd = context.createRadialGradient(s.x, s.y, s.radius, e.x, e.y, e.radius);
                var colorStops = fill.colorStops;

                for(var n = 0; n < colorStops.length; n += 2) {
                    grd.addColorStop(colorStops[n], colorStops[n + 1]);
                }
                f = grd;
                context.fillStyle = f;
                context.fill();
            }else {
                f = 'black';
                context.fillStyle = f;
                context.fill();
            }
        }
        context.restore();

        if(appliedShadow) {
            this.fill();
        }
    },
    fillText: function(text) {
        var appliedShadow = false;
        var context = this.getContext();
        context.save();
        if(this.attrs.textFill) {
            if(this.attrs.shadow && !this.appliedShadow) {
                appliedShadow = this._applyShadow();
            }
            context.fillStyle = this.attrs.textFill;
            context.fillText(text, 0, 0);
        }
        context.restore();

        if(appliedShadow) {
            this.fillText(text, 0, 0);
        }
    },
    strokeText: function(text) {
        var appliedShadow = false;
        var context = this.getContext();
        context.save();
        if(this.attrs.textStroke || this.attrs.textStrokeWidth) {
            if(this.attrs.shadow && !this.appliedShadow) {
                appliedShadow = this._applyShadow();
            }

            if(!this.attrs.textStroke) {
                this.attrs.textStroke = 'black';
            }
            else if(!this.attrs.textStrokeWidth && this.attrs.textStrokeWidth !== 0) {
                this.attrs.textStrokeWidth = 2;
            }
            context.lineWidth = this.attrs.textStrokeWidth;
            context.strokeStyle = this.attrs.textStroke;
            context.strokeText(text, 0, 0);
        }
        context.restore();

        if(appliedShadow) {
            this.strokeText(text, 0, 0);
        }
    },
    drawImage: function() {
        var appliedShadow = false;
        var context = this.getContext();
        context.save();
        var a = Array.prototype.slice.call(arguments);

        if(a.length === 5 || a.length === 9) {
            if(this.attrs.shadow && !this.appliedShadow) {
                appliedShadow = this._applyShadow();
            }
            switch(a.length) {
                case 5:
                    context.drawImage(a[0], a[1], a[2], a[3], a[4]);
                    break;
                case 9:
                    context.drawImage(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
                    break;
            }
        }

        context.restore();

        if(appliedShadow) {
            this.drawImage.apply(this, a);
        }
    },
    applyLineJoin: function() {
        var context = this.getContext();
        if(this.attrs.lineJoin) {
            context.lineJoin = this.attrs.lineJoin;
        }
    },
    _applyShadow: function() {
        var context = this.getContext();
        var s = this.attrs.shadow;
        if(s) {
            var aa = this.getAbsoluteAlpha();
            var color = s.color ? s.color : 'black';
            var blur = s.blur ? s.blur : 5;
            var offset = s.offset ? s.offset : {
                x: 0,
                y: 0
            };

            if(s.alpha) {
                context.globalAlpha = s.alpha * aa;
            }
            context.shadowColor = color;
            context.shadowBlur = blur;
            context.shadowOffsetX = offset.x;
            context.shadowOffsetY = offset.y;
            this.appliedShadow = true;
            return true;
        }

        return false;
    },
    saveData: function() {
        var stage = this.getStage();
        var w = stage.attrs.width;
        var h = stage.attrs.height;

        var bufferLayer = stage.bufferLayer;
        var bufferLayerContext = bufferLayer.getContext();

        bufferLayer.clear();
        this._draw(bufferLayer);

        var imageData = bufferLayerContext.getImageData(0, 0, w, h);
        this.data = imageData.data;
    },
    clearData: function() {
        this.data = [];
    },
    intersects: function() {
        var pos = Kinetic.Type._getXY(Array.prototype.slice.call(arguments));
        var stage = this.getStage();
 //txtTest.value = 'x:' + pos.x + ' y:' + pos.y;
        if(this.attrs.detectionType === 'path') {
            var pathLayer = stage.pathLayer;
            var pathLayerContext = pathLayer.getContext();
            this._draw(pathLayer);

            return pathLayerContext.isPointInPath(pos.x, pos.y);
        }else if (this.attrs.detectionType === 'curve'){
            var w = stage.attrs.width,
                con = gVar.con;
            var x = pos.x - 1, y = pos.y -1,alpha;
            for(var i=0; i<3; i++){
                for(j=0; j<3; j++){
                    alpha = this.mask[((w * y) + x) * 4 + 3];
                    if(!!alpha){
                        return true;
                    }
                    x++;
                }
                y++;
                x -= 3;
            } 
            return false;
            //var alpha = this.mask[((w * pos.y) + pos.x) * 4 + 3];
            //return (!!alpha);
        }
        else {
            var w = stage.attrs.width;
            var alpha = this.data[((w * pos.y) + pos.x) * 4 + 3];
            return (!!alpha);
        }
    },
    _draw: function(layer) {
        if(layer && this.attrs.drawFunc) {
            var stage = layer.getStage();
            var context = layer.getContext();
            var family = [];
            var parent = this.parent;

            family.unshift(this);
            while(parent) {
                family.unshift(parent);
                parent = parent.parent;
            }

            context.save();
            for(var n = 0; n < family.length; n++) {
                var node = family[n];
                var t = node.getTransform();

                if(node.attrs.offset.x !== 0 || node.attrs.offset.y !== 0) {
                    t.translate(-1 * node.attrs.offset.x, -1 * node.attrs.offset.y);
                }

                var m = t.getMatrix();
                context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
            }

            this.tempLayer = layer;

            var absAlpha = this.getAbsoluteAlpha();
            if(absAlpha !== 1) {
                context.globalAlpha = absAlpha;
            }
            this.applyLineJoin();
            this.appliedShadow = false;
            this.attrs.drawFunc.call(this);
            context.restore();
        }
    }
});

Kinetic.Node.addGettersSetters(Kinetic.Shape, ['fill', 'stroke', 'lineJoin', 'strokeWidth', 'shadow', 'drawFunc']);

Kinetic.Rect = Kinetic.Shape.extend({
    init: function(config) {
        this.setDefaultAttrs({
            width: 0,
            height: 0,
            cornerRadius: 0
        });

        this.shapeType = "Rect";

        config.drawFunc = function() {
            var context = this.getContext();
            context.beginPath();
            if(this.attrs.cornerRadius === 0) {
                context.rect(0, 0, this.attrs.width, this.attrs.height);
            }
            else {
                context.moveTo(this.attrs.cornerRadius, 0);
                context.lineTo(this.attrs.width - this.attrs.cornerRadius, 0);
                context.arc(this.attrs.width - this.attrs.cornerRadius, this.attrs.cornerRadius, this.attrs.cornerRadius, Math.PI * 3 / 2, 0, false);
                context.lineTo(this.attrs.width, this.attrs.height - this.attrs.cornerRadius);
                context.arc(this.attrs.width - this.attrs.cornerRadius, this.attrs.height - this.attrs.cornerRadius, this.attrs.cornerRadius, 0, Math.PI / 2, false);
                context.lineTo(this.attrs.cornerRadius, this.attrs.height);
                context.arc(this.attrs.cornerRadius, this.attrs.height - this.attrs.cornerRadius, this.attrs.cornerRadius, Math.PI / 2, Math.PI, false);
                context.lineTo(0, this.attrs.cornerRadius);
                context.arc(this.attrs.cornerRadius, this.attrs.cornerRadius, this.attrs.cornerRadius, Math.PI, Math.PI * 3 / 2, false);
            }
            context.closePath();

            this.fill();
            this.stroke();
        };
        this._super(config);
    },
    setSize: function() {
        var size = Kinetic.Type._getSize(Array.prototype.slice.call(arguments));
        this.setAttrs(size);
    },
    getSize: function() {
        return {
            width: this.attrs.width,
            height: this.attrs.height
        };
    }
});

Kinetic.Node.addGettersSetters(Kinetic.Rect, ['width', 'height', 'cornerRadius']);


Kinetic.Ellipse = Kinetic.Shape.extend({
    init: function(config) {
        this.setDefaultAttrs({
            radius: {
                x: 0,
                y: 0
            }
        });

        this.shapeType = "Ellipse";

        config.drawFunc = function() {
            var canvas = this.getCanvas();
            var context = this.getContext();
            var r = this.getRadius();
            context.beginPath();
            context.save();
            if(r.x !== r.y) {
                context.scale(1, r.y / r.x);
            }
            context.arc(0, 0, r.x, 0, Math.PI * 2, true);
            context.restore();
            context.closePath();
            this.fill();
            this.stroke();
        };
        // call super constructor
        this._super(config);

        this._convertRadius();

        var that = this;
        this.on('radiusChange.kinetic', function() {
            that._convertRadius();
        });
    },
    _convertRadius: function() {
        var type = Kinetic.Type;
        var radius = this.getRadius();
        if(type._isObject(radius)) {
            return false;
        }
        this.attrs.radius = type._getXY(radius);
    }
});

Kinetic.Circle = Kinetic.Ellipse;

Kinetic.Node.addGettersSetters(Kinetic.Ellipse, ['radius']);

Kinetic.Image = Kinetic.Shape.extend({
    init: function(config) {
        this.shapeType = "Image";
        config.drawFunc = function() {
            if(!!this.attrs.image) {
                var width = !!this.attrs.width ? this.attrs.width : this.attrs.image.width;
                var height = !!this.attrs.height ? this.attrs.height : this.attrs.image.height;
                var canvas = this.getCanvas();
                var context = this.getContext();

                context.beginPath();
                context.rect(0, 0, width, height);
                context.closePath();
                this.fill();
                this.stroke();

                if(this.attrs.crop && this.attrs.crop.width && this.attrs.crop.height) {
                    var cropX = this.attrs.crop.x ? this.attrs.crop.x : 0;
                    var cropY = this.attrs.crop.y ? this.attrs.crop.y : 0;
                    var cropWidth = this.attrs.crop.width;
                    var cropHeight = this.attrs.crop.height;
                    this.drawImage(this.attrs.image, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height);
                }else {
                    this.drawImage(this.attrs.image, 0, 0, width, height);
                }
            }
        };
        this._super(config);
    },
    setSize: function() {
        var size = Kinetic.GlobalObject._getSize(Array.prototype.slice.call(arguments));
        this.setAttrs(size);
    },
    getSize: function() {
        return {
            width: this.attrs.width,
            height: this.attrs.height
        };
    }
});


Kinetic.Node.addGettersSetters(Kinetic.Image, ['height', 'width', 'image', 'crop']);

Kinetic.Text = Kinetic.Shape.extend({
    init: function(config) {
        this.setDefaultAttrs({
            fontFamily: 'Calibri',
            text: '',
            fontSize: 12,
            align: 'left',
            verticalAlign: 'top',
            fontStyle: 'normal',
            padding: 0,
            width: 'auto',
            height: 'auto',
            detectionType: 'path',
            cornerRadius: 0,
            lineHeight: 1.2
        });

        this.dummyCanvas = document.createElement('canvas');
        this.shapeType = "Text";

        config.drawFunc = function() {
            var context = this.getContext();

            context.beginPath();
            var boxWidth = this.getBoxWidth();
            var boxHeight = this.getBoxHeight();

            if(this.attrs.cornerRadius === 0) {
                context.rect(0, 0, boxWidth, boxHeight);
            }else {
                context.moveTo(this.attrs.cornerRadius, 0);
                context.lineTo(boxWidth - this.attrs.cornerRadius, 0);
                context.arc(boxWidth - this.attrs.cornerRadius, this.attrs.cornerRadius, this.attrs.cornerRadius, Math.PI * 3 / 2, 0, false);
                context.lineTo(boxWidth, boxHeight - this.attrs.cornerRadius);
                context.arc(boxWidth - this.attrs.cornerRadius, boxHeight - this.attrs.cornerRadius, this.attrs.cornerRadius, 0, Math.PI / 2, false);
                context.lineTo(this.attrs.cornerRadius, boxHeight);
                context.arc(this.attrs.cornerRadius, boxHeight - this.attrs.cornerRadius, this.attrs.cornerRadius, Math.PI / 2, Math.PI, false);
                context.lineTo(0, this.attrs.cornerRadius);
                context.arc(this.attrs.cornerRadius, this.attrs.cornerRadius, this.attrs.cornerRadius, Math.PI, Math.PI * 3 / 2, false);
            }
            context.closePath();

            this.fill();
            this.stroke();
            var p = this.attrs.padding;
            var lineHeightPx = this.attrs.lineHeight * this.getTextHeight();
            var textArr = this.textArr;

            context.font = this.attrs.fontStyle + ' ' + this.attrs.fontSize + 'pt ' + this.attrs.fontFamily;
            context.textBaseline = 'middle';
            context.textAlign = 'left';
            context.save();
            context.translate(p, 0);
            context.translate(0, p + this.getTextHeight() / 2);

            for(var n = 0; n < textArr.length; n++) {
                var text = textArr[n];

                context.save();
                if(this.attrs.align === 'right') {
                    context.translate(this.getBoxWidth() - this._getTextSize(text).width - p * 2, 0);
                }
                else if(this.attrs.align === 'center') {
                    context.translate((this.getBoxWidth() - this._getTextSize(text).width - p * 2) / 2, 0);
                }

                this.fillText(text);
                this.strokeText(text);
                context.restore();

                context.translate(0, lineHeightPx);
            }
            context.restore();
        };
        this._super(config);
        var attrs = ['width', 'height', 'padding', 'text', 'textStroke', 'textStrokeWidth'];
        var that = this;
        for(var n = 0; n < attrs.length; n++) {
            var attr = attrs[n];
            this.on(attr + 'Change.kinetic', that._setTextData);
        }

        that._setTextData();
    },
    getTextWidth: function() {
        return this.textWidth;
    },
    getTextHeight: function() {
        return this.textHeight;
    },
    getBoxWidth: function() {
        return this.attrs.width === 'auto' ? this.getTextWidth() + this.attrs.padding * 2 : this.attrs.width;
    },
    getBoxHeight: function() {
        return this.attrs.height === 'auto' ? (this.getTextHeight() * this.textArr.length * this.attrs.lineHeight) + this.attrs.padding * 2 : this.attrs.height;
    },
    _getTextSize: function(text) {
        var dummyCanvas = this.dummyCanvas;
        var context = dummyCanvas.getContext('2d');

        context.save();
        context.font = this.attrs.fontStyle + ' ' + this.attrs.fontSize + 'pt ' + this.attrs.fontFamily;
        var metrics = context.measureText(text);
        context.restore();
        return {
            width: metrics.width,
            height: parseInt(this.attrs.fontSize, 10)
        };
    },
    _setTextData: function() {
        var charArr = this.attrs.text.split('');
        var arr = [];
        var row = 0;
        var addLine = true;
        this.textWidth = 0;
        this.textHeight = this._getTextSize(this.attrs.text).height;
        var lineHeightPx = this.attrs.lineHeight * this.textHeight;
        while(charArr.length > 0 && addLine && (this.attrs.height === 'auto' || lineHeightPx * (row + 1) < this.attrs.height - this.attrs.padding * 2)) {
            var index = 0;
            var line = undefined;
            addLine = false;

            while(index < charArr.length) {
                if(charArr.indexOf('\n') === index) {
                    charArr.splice(index, 1);
                    line = charArr.splice(0, index).join('');
                    break;
                }
                var lineArr = charArr.slice(0, index);
                if(this.attrs.width !== 'auto' && this._getTextSize(lineArr.join('')).width > this.attrs.width - this.attrs.padding * 2) {
                    if(index == 0) {
                        break;
                    }
                    var lastSpace = lineArr.lastIndexOf(' ');
                    var lastDash = lineArr.lastIndexOf('-');
                    var wrapIndex = Math.max(lastSpace, lastDash);
                    if(wrapIndex >= 0) {
                        line = charArr.splice(0, 1 + wrapIndex).join('');
                        break;
                    }
                    line = charArr.splice(0, index).join('');
                    break;
                }
                index++;
                if(index === charArr.length) {
                    line = charArr.splice(0, index).join('');
                }
            }
            this.textWidth = Math.max(this.textWidth, this._getTextSize(line).width);
            if(line !== undefined) {
                arr.push(line);
                addLine = true;
            }
            row++;
        }
        this.textArr = arr;
    }
});
Kinetic.Node.addGettersSetters(Kinetic.Text, ['fontFamily', 'fontSize', 'fontStyle', 'textFill', 'textStroke', 'textStrokeWidth', 'padding', 'align', 'lineHeight', 'text', 'width', 'height', 'cornerRadius', 'fill', 'stroke', 'strokeWidth', 'shadow']);


Kinetic.Line = Kinetic.Shape.extend({
    init: function(config) {
        this.setDefaultAttrs({
            points: [],
            lineCap: 'butt',
            dashArray: [],
            detectionType: 'pixel'
        });

        this.shapeType = "Line";
        config.drawFunc = function() {
            var context = this.getContext();
            var lastPos = {};
            context.beginPath();

            context.moveTo(this.attrs.points[0].x, this.attrs.points[0].y);

            for(var n = 1; n < this.attrs.points.length; n++) {
                var x = this.attrs.points[n].x;
                var y = this.attrs.points[n].y;
                if(this.attrs.dashArray.length > 0) {
                    var lastX = this.attrs.points[n - 1].x;
                    var lastY = this.attrs.points[n - 1].y;
                    this._dashedLine(lastX, lastY, x, y, this.attrs.dashArray);
                }else {
                    context.lineTo(x, y);
                }
            }

            if(!!this.attrs.lineCap) {
                context.lineCap = this.attrs.lineCap;
            }

            this.stroke();
        };
        this._super(config);
    },
    _dashedLine: function(x, y, x2, y2, dashArray) {
        var context = this.getContext();
        var dashCount = dashArray.length;

        var dx = (x2 - x), dy = (y2 - y);
        var xSlope = dx > dy;
        var slope = (xSlope) ? dy / dx : dx / dy;

        if(slope > 9999) {
            slope = 9999;
        }else if(slope < -9999) {
            slope = -9999;
        }

        var distRemaining = Math.sqrt(dx * dx + dy * dy);
        var dashIndex = 0, draw = true;
        while(distRemaining >= 0.1 && dashIndex < 10000) {
            var dashLength = dashArray[dashIndex++ % dashCount];
            if(dashLength === 0) {
                dashLength = 0.001;
            }
            if(dashLength > distRemaining) {
                dashLength = distRemaining;
            }
            var step = Math.sqrt(dashLength * dashLength / (1 + slope * slope));
            if(xSlope) {
                x += dx < 0 && dy < 0 ? step * -1 : step;
                y += dx < 0 && dy < 0 ? slope * step * -1 : slope * step;
            }
            else {
                x += dx < 0 && dy < 0 ? slope * step * -1 : slope * step;
                y += dx < 0 && dy < 0 ? step * -1 : step;
            }
            context[draw ? 'lineTo' : 'moveTo'](x, y);
            distRemaining -= dashLength;
            draw = !draw;
        }

        context.moveTo(x2, y2);
    }
});

Kinetic.Node.addGettersSetters(Kinetic.Line, ['dashArray', 'lineCap', 'points']);



if(1){/////////////////////////////////////////
Kinetic.QuadraticCurve = Kinetic.Shape.extend({
    init: function(config) {
        this.setDefaultAttrs({
            points: [],
            stroke: 'black',
            strokeWidth: 1,
            type: 'solid',
            detectionType: 'curve'
        });

        this.mask = {};
        this.shapeType = "QuadraticCurve";
        this.dotCurve = false;
        if(config.type && config.type == 'dot'){
            this.shapeType = "DotCurve";
            this.dotCurve = true
        }

        
        config.drawFunc = function() {
            var context = this.getContext(),
                points = this.attrs.points,
                sx = points[0].x,
                sy = points[0].y,
                cx = points[1].x,
                cy = points[1].y,
                ex = points[2].x,
                ey = points[2].y;
 
             if(this.dotCurve){
                var flag = true;
                var lastX,lastY,dis,curX,curY;
                for(var i=0,j=1; i<=1; i=i+0.001,j++){
                    if(flag){
                        if(j==1){
                            var dif = 1 - i;
                            lastX = dif*(dif*sx + 2*i*cx) + i*i*ex;
                            lastY = dif*(dif*sy + 2*i*cy) + i*i*ey;
                            context.beginPath();
                            context.moveTo(lastX,lastY);
                        }else{
                            var dif = 1 - i;
                            curX = dif*(dif*sx + 2*i*cx) + i*i*ex;
                            curY = dif*(dif*sy + 2*i*cy) + i*i*ey;
                            dis = Math.sqrt(Math.pow(lastX-curX,2) + Math.pow(lastY-curY,2));
                            if(dis > 5){
                                context.lineTo(curX,curY);
                                this.stroke();
                                lastX = curX;
                                lastY = curY;
                                flag = false;
                            }
                        }
                    }else{
                        var dif = 1 - i;
                        curX = dif*(dif*sx + 2*i*cx) + i*i*ex;
                        curY = dif*(dif*sy + 2*i*cy) + i*i*ey;
                        dis = Math.sqrt(Math.pow(lastX-curX,2) + Math.pow(lastY-curY,2));
                        if(dis > 5){
                            flag = true;
                            j = 0;
                        }
                    }
                }
             }else{
                context.beginPath();
                context.moveTo(sx,sy);
                for(var i=0.01; i<=1; i=i+0.01){
                    var dif = 1 - i;
                    var x = dif*(dif*sx + 2*i*cx) + i*i*ex;
                    var y = dif*(dif*sy + 2*i*cy) + i*i*ey;
                    
                    context.lineTo(x,y);
                }
                context.lineTo(ex,ey);
                this.stroke();
            }
        };
        this._super(config);
    },
    setDot:function(arg){
        if(arg){
            this.dotCurve = true;
        }else{
            this.dotCurve = false;
        }
    },
    saveDot:function(){
        var stage = this.getStage();
        var w = stage.attrs.width;
        var points = this.attrs.points;
        var sx = points[0].x,
            sy = points[0].y,
            cx = points[1].x,
            cy = points[1].y,
            ex = points[2].x,
            ey = points[2].y;

        this.mask = {};  
        for(var i=0.001; i<1; i=i+0.001){
            var dif = 1 - i;
            var x = dif*(dif*sx + 2*i*cx) + i*i*ex;
            var y = dif*(dif*sy + 2*i*cy) + i*i*ey;   
            this.mask[((w * parseInt(y)) + parseInt(x)) * 4 + 3] = 1;
        }
    },
    clearDot:function(){
        this.mask = {};
    },
    focusFunc:function(){
        var dash = this.dash,
            anchors = this.anchors;
        if(dash.attrs.visible){
            return;
        }
        dash.show();
        for(var i=0,l=anchors.length; i<l; i++){
            anchors[i].show();
        }
        this.getLayer().draw();
    },
    blurFunc: function(){
        //console.log('33333',this);
        var dash = this.dash,
            anchors = this.anchors;
        if(!dash.attrs.visible){
            return;
        }
        dash.hide();
        for(var i=0,l=anchors.length; i<l; i++){
            anchors[i].hide();
        }
        this.getLayer().draw();
    }
});

Kinetic.Node.addGettersSetters(Kinetic.QuadraticCurve, []);
}



Kinetic.Transform = function() {
    this.m = [1, 0, 0, 1, 0, 0];
}

Kinetic.Transform.prototype = {
    translate: function(x, y) {
        this.m[4] += this.m[0] * x + this.m[2] * y;
        this.m[5] += this.m[1] * x + this.m[3] * y;
    },
    scale: function(sx, sy) {
        this.m[0] *= sx;
        this.m[1] *= sx;
        this.m[2] *= sy;
        this.m[3] *= sy;
    },
    rotate: function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        var m11 = this.m[0] * c + this.m[2] * s;
        var m12 = this.m[1] * c + this.m[3] * s;
        var m21 = this.m[0] * -s + this.m[2] * c;
        var m22 = this.m[1] * -s + this.m[3] * c;
        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
    },
    getTranslation: function() {
        return {
            x: this.m[4],
            y: this.m[5]
        };
    },
    multiply: function(matrix) {
        var m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
        var m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];

        var m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
        var m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

        var dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
        var dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];

        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
        this.m[4] = dx;
        this.m[5] = dy;
    },
    invert: function() {
        var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
        var m0 = this.m[3] * d;
        var m1 = -this.m[1] * d;
        var m2 = -this.m[2] * d;
        var m3 = this.m[0] * d;
        var m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
        var m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
        this.m[0] = m0;
        this.m[1] = m1;
        this.m[2] = m2;
        this.m[3] = m3;
        this.m[4] = m4;
        this.m[5] = m5;
    },
    getMatrix: function() {
        return this.m;
    }
};






if(1){
Kinetic.Arrow = Kinetic.Shape.extend({
    init: function(config) {
        this.setDefaultAttrs({
            points: [],
            stroke: 'black',
            strokeWidth: 1,
            sizeX: 16,
            sizeY: 16,
            fill: 'black',
            stroke: 'black',
            isFill: false
        });

        this.shapeType = "Arrow";
        config.drawFunc = function() {
            var context = this.getContext();
            var attrs = this.attrs,
                points = attrs.points;
                sizeX = attrs.sizeX,
                sizeY = attrs.sizeY,
                hx = sizeX/2,
                hy = sizeY/2,
                locx = points[2].x,
                locy = points[2].y,
                ang = Math.atan((locy - points[1].y) / (locx - points[1].x));
   
            if(locx < points[1].x){
                ang = ang - 135;
            }
            //context.fillStyle = "rgba(255, 255, 255,1)"; //attrs.fill;
            context.fillRect(locx, locy, 2, 2);
            context.translate((locx), (locy));
            context.rotate(ang);
           // context.translate(-hx,-hy);
           context.translate(-1.5*hx,-hy);
            
            context.beginPath();
            context.moveTo(0,0);
            context.lineTo(0,sizeY);    
            context.lineTo(sizeX,hy);
            context.closePath();
            
            //if(attrs.isFill){
                this.fill();
            //}
            this.stroke();
            
            //restore
            //context.translate(hx,hy);     
            context.translate(1.5*hx,hy);     
            context.rotate(-ang);     
            context.translate(-(locx),-(locy));
        };
        this._super(config);
    },
    setPoints:function(arr){
        this.attrs.cx = arr[1].x;
        this.attrs.cy = arr[1].y;
        this.attrs.ex = arr[2].x;
        this.attrs.ey = arr[2].y;
    },
    focusFunc:function(){
        var layer = this.getLayer(),
            dash = this.attrs.dash,
            anchors = dash.attrs.anchors;
        if(dash.attrs.visible){
            return;
        }
        dash.show();
        for(var i=0,l=anchors.length; i<l; i++){
            anchors[i].show();
        }
        layer.draw();
    },
    blurFunc:function(){
        var layer = this.getLayer(),
            dash = this.attrs.dash,
            anchors = dash.attrs.anchors;
        if(!dash.attrs.visible){
            return;
        }
        dash.hide();
        for(var i=0,l=anchors.length; i<l; i++){
            anchors[i].hide();
        }
        layer.draw();
    }
});

Kinetic.Node.addGettersSetters(Kinetic.Arrow, []);


Kinetic.Grid = Kinetic.Shape.extend({
    init: function(config) {
        this.setDefaultAttrs({
            width: 0,
            height: 0,
            detectionType: 'path',
            spacing: 15,
            gridStroke: 'gray'
        });

        this.shapeType = "Grid";

        config.drawFunc = function() {

            var i = 0,
                context = this.getContext(),
                w = this.attrs.width,
                h = this.attrs.height,
                spacing = this.attrs.spacing;

            context.beginPath();
            context.beginPath();
            context.rect(0, 0, w, h);
            context.closePath();
            this.fill();
            this.stroke();
           
            context.lineWidth = 1;
            context.strokeStyle = this.attrs.gridStroke;
            
            h = h + spacing;
            w = w + spacing;
            while(i < h){
                context.moveTo(0, i + 0.5);
                context.lineTo(w, i + 0.5);
                context.stroke();

                i = i + spacing;
            }
            i = 0;
            while(i < w){
                context.moveTo(i + 0.5, 0);
                context.lineTo(i + 0.5, h);
                context.stroke();
                i = i + spacing;
            }

        };
        this._super(config);
    }
});

Kinetic.Node.addGettersSetters(Kinetic.Grid, ['width', 'height']);

}