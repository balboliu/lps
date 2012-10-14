function LPS(id, config){

    var data, jq, stageDOM,
        that = this;
        util = gVar.util,
        type = gVar.type;
    
    if(jQuery && this.isFunction(jQuery)){
        this.$ = jq = jQuery;
    }else{
        alert('jquery');
        return;
    }
    
    this.id = id;
    this.div = jq('#' + id);
    if(!this.div || this.div.length == 0 || this.div[0].tagName != 'DIV'){
        alert('div');
        return;
    }
    this.div.css('overflow','auto');
    
    if(!Kinetic || !Kinetic.Stage){
        alert('Kinetic');
        return;
    }
    
    this.stage = new Kinetic.Stage({
        container: id ,
        width: this.div.width(),
        height: this.div.height()
    });
    
    if(typeof this.stage.config != 'undefined'){
        alert('this.stage.config');
        return;
    }
    this.stage.config = {
        onDbClick: function(){},
        onMouseover: function(){},
        onMouseout: function(){},
        onDraw: function(){},
        onRightClick: function(obj){},
        onDragEnd: function(){
            return  true;
        }
    };
    
    jq.extend(this.stage.config, config);
    
    if(typeof this.stage.data != 'undefined'){
        alert('this.stage.data');
        return;
    }
    this.stage.data = {};
    data = this.stage.data;

    data.text = null; 
    data.selPrim = null;
    data.selType = type.NONE;
    data.line = {
        flag: true,
        anchors: null,
        src: null,
        toDrawLine: false
    };
    data.attachPrim = {};
    data.lines = {};
    data.count = 1;
    data.config = null;

    data.layer = new Kinetic.Layer();
    
    data.bg = new Kinetic.Rect({
        x: 0,
        y: 0,
        width: this.stage.attrs.width,
        height: this.stage.attrs.height,
        alpha: 0,
        draggable: true,
        dragBounds: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        }
    });
    data.bg.type = type.BG;

    data.bg.on('mousedown',function(evt){
        util.blurFocus(this);
    });
    
    data.bg.on('dblclick',function(e){
        that.stage.config.onDbClick({src: this, e: e});
    });
    data.bg.on('dragstart',function(e){
        var line = that.stage.data.line;
            
        if(line.toDrawLine && line.flag){
            line.flag = false; //PDC(Position Dependent Code)
            util.drawCurve( that.stage);
        }
    });   
    data.layer.add(data.bg);
    this.stage.add(data.layer);
    
    util.setRightMenu(this.stage);
    
    
    
    stageDOM = this.stage.getDOM();
    jq(stageDOM).mouseup(function(evt) {
        data.selType = type.NONE;
        data.line.toDrawLine = false;
    });
    jq(stageDOM).mousedown( function(evt) {
        if(data.selType == type.NONE){
            return;
        }else {
            if(data.selType != type.QUAD_CURVE){
                data.line.toDrawLine = false;
            }
            if(data.selType == type.CIRCLE){
                util.drawCircle(that.stage, data.config);
            }else if(data.selType == type.STRIPE){
                util.drawStripe(that.stage, data.config);
            }else if(data.selType == type.RECT){
                util.drawRect(that.stage, data.config);
            }
        }
    });
    return this;
}

LPS.prototype = {
    isFunction: function(obj){
        return !!(obj && obj.constructor && obj.call && obj.apply);
    },
	destroy: function() {
	},
	loadJson: function( json ) {
        var util = gVar.util;
        util.load(this.stage, json);
	},
	getJson: function() {
        var json, 
            util = gVar.util;
        json = util.toJson(this.stage);
        return json;
	},
	clear: function() {
        var i, attachPrim, lines, 
            data = this.stage.data;
            
        this.stage.clear();
        
        attachPrim = data.attachPrim;
        for(i in attachPrim){
            attachPrim[i].deleteFunc();
        }
        data.attachPrim = {};
        
        lines = data.lines;
        for(i in lines){
            lines[i].deleteFunc();
        }
        data.lines = {};
	},
	getSelectedPrim: function() {
        var prim = this.stage.data.selPrim;
        if(prim){
            if(prim.type == gVar.type.BG){
                return null;
            }
            return prim;
        }
	},
    getAllByType: function(type){
        var i, prim,
            data = this.stage.data,
            attachPrim = data.attachPrim,
            lines = data.lines,
            ret = [];

        if(type){
            if(type == gVar.type.QUAD_CURVE){
                for(i in lines){
                    ret.push(lines[i]);
                }
            }else{
                for(i in attachPrim){
                    prim = attachPrim[i];
                    if(prim.type == type){
                        ret.push(prim);
                    }
                }
            }
        }else{
            for(i in attachPrim){
                ret.push(attachPrim[i]);
            }
            for(i in lines){
                ret.push(lines[i]);
            }
        }
        return ret;
    },
    toDrawCurve: function(config){
        var data = this.stage.data;
        data.config = config;
        data.selType = gVar.type.QUAD_CURVE;
        data.line.toDrawLine = true;
    },
    toDrawCircle: function(config){
        var data = this.stage.data;
        data.config = config;
        data.selType = gVar.type.CIRCLE;
    },
    toDrawRect: function(config){
        var data = this.stage.data;
        data.config = config;
        data.selType = gVar.type.RECT;
    },
    toDrawStripe: function(config){
        var data = this.stage.data;
        data.config = config;
        data.selType = gVar.type.STRIPE
    }
}