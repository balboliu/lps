var gVar;
(function (){

    if(!Kinetic || !Kinetic.Global){//flowchart dependent on Kinetic
        alert('Kinetic');
        return;
    }
    
    var util, br, 
        appName = 'lps',
        go = Kinetic.Global;
        
    go[appName] = {};
    gVar = go[appName];

    
    gVar.type = {
        NONE: 0, BG: 1, QUAD_CURVE: 2, CIRCLE: 3, STRIPE: 4, RECT: 5 
    };
    
    
    //browser detect
    if(window.navigator.userAgent.indexOf('MSIE') != -1){
        if(window.navigator.userAgent.indexOf("MSIE 6.0") >= 0 || 
            window.navigator.userAgent.indexOf("MSIE 7.0") >= 0 ||
            window.navigator.userAgent.indexOf("MSIE 8.0") >= 0){
            alert('browser');
            return;
        }
    }
    gVar.util = {};
    util = gVar.util;

    /*
    function $(div){
        return 'string' == typeof div ? document.getElementById(div) : div;
    }
    util.$ = $;
    
    function merge(config,ops){
        for(var i in config){
            ops[i] = config[i];
        }
    }
    util.merge = merge;

    if(window.console && console.log){
        if(br.type == br.FF){
            util.log = window.console.log;
        }else{
            util.log = function(){
                window.console.log(arguments);
            }
        }
    }else{
        util.log = function(){};
    }*/
    
    function curveConfig(tmp, curve, points){
        tmp.config = {
            points: points,
            type: curve.attrs.type,
            curveStroke: curve.attrs.stroke,
            draggable: curve.attrs.draggable,
            
            dashArray: curve.dash.attrs.dashArray,
            dashStroke: curve.dash.attrs.stroke,
            dashStrokeWidth: curve.dash.attrs.strokeWidth,
            
            text: curve.text.attrs.text,
            textWidth : curve.text.attrs.width,
            textHeight: curve.text.attrs.height,
            textAlign: curve.text.attrs.align,
            textPadding: curve.text.attrs.padding,
            textFontSize: curve.text.attrs.fontSize,
            textFontFamily: curve.text.attrs.fontFamily,
            textFill: curve.text.attrs.textFill,
            
            arrowSizeX: curve.arrow.attrs.sizeX,
            arrowSizeY: curve.arrow.attrs.sizeY,
            arrowFill: curve.arrow.attrs.fill,
            arrowStroke: curve.arrow.attrs.stroke,
            arrowStrokeWidth: curve.arrow.attrs.strokeWidth,
            
            anchorRadius: curve.anchors[0].attrs.radius, 
            anchorStroke: curve.anchors[0].attrs.stroke,
            anchorDetachFill: curve.anchors[0].attrs.detachFill,
            anchorAttachFill: curve.anchors[0].attrs.attachFill,
            anchorStrokeWidth: curve.anchors[0].attrs.strokeWidth
        };
        if(curve.properties){
            tmp.properties = curve.properties;
        }
    }

    function toJson(stage){
        var prim, attrs, config, attachNode,  points, pts, ltTextAttr, rtTextAttr, shape, 
            i, k, curve, num,
            lines = stage.data.lines,
            prims = stage.data.attachPrim,
            canvas =  stage.data.layer.canvas,
            json = {};
            json['prim'] = {};
            json['canvas'] = {};
            json['canvas'].width = canvas.width;
            json['canvas'].height = canvas.height;
            
        for(i in prims){
            prim = prims[i];
            attrs = prim.attrs;
            if(!attrs || prim.type < 3){
                continue;
            }
            
            shape = json['prim'][prim.type + '_' + prim._id] = {};
            //record config
            if(prim.properties){
                shape.properties = prim.properties;
            }
            
            config  = shape.config = {};
            config.x = attrs.x;
            config.y = attrs.y;
            config.fill = attrs.fill;
            config.stroke = attrs.stroke;
            config.blurStroke = attrs.blurStroke;
            config.focusStroke = attrs.focusStroke;
            config.strokeWidth = attrs.strokeWidth;
            config.draggable = attrs.draggable;
            switch(prim.type){
                case 3:
                    config.radius = attrs.radius;
                    break;
                 case 4:
                    config.width = attrs.width;
                    config.height = attrs.height;
                    config.minHeight = attrs.minHeight;
                    config.apNum = attrs.apNum;
                    config.anchorRadius = attrs.anchorRadius;
                    config.anchorStroke = attrs.anchorStroke;
                    config.anchorFill = attrs.anchorFill;
                    config.anchorStrokeWidth = attrs.anchorStrokeWidth
                    config.anchorDraggable = attrs.anchorDraggable;
                    break;
                case 5:
                    config.width = attrs.width;
                    config.height = attrs.height;
                    config.text = attrs.text;
                    config.align =  attrs.align;
                    config.fontSize =  attrs.fontSize;
                    config.fontFamily = attrs.fontFamily;
                    config.padding = attrs.padding;
                    config.textFill = attrs.textFill;
                    
                    ltTextAttr = prim.leftTopTxt.attrs;
                    rtTextAttr = prim.rightTopTxt.attrs;

                    config.ltText = ltTextAttr.text;
                    config.ltHeight = ltTextAttr.height;
                    config.ltWidth = ltTextAttr.width;
                    config.ltAlign = ltTextAttr.align;
                    config.ltFontSize= ltTextAttr.fontSize;
                    config.ltFontFamily = ltTextAttr.fontFamily;
                    config.ltFill = ltTextAttr.fill;
                    config.ltPadding = ltTextAttr.padding;
                    config.ltStroke = ltTextAttr.stroke;
                    config.ltTextFill = ltTextAttr.textFill;
                    config.ltStrokeWidth = ltTextAttr.strokeWidth;
                    
                    config.rtText = rtTextAttr.text;
                    config.rtHeight = rtTextAttr.height; 
                    config.rtWidth = rtTextAttr.width;
                    config.rtAlign = rtTextAttr.align;
                    config.rtFontSize = rtTextAttr.fontSize;
                    config.rtFontFamily = rtTextAttr.fontFamily;
                    config.rtFill = rtTextAttr.fill;
                    config.rtPadding = rtTextAttr.padding;
                    config.rtStroke = rtTextAttr.stroke;
                    config.rtStrokeWidth = rtTextAttr.strokeWidth;
                    config.rtTextFill = rtTextAttr.textFill;
                    break;
                default:
                    break;
            }
            //record curve
            attachNode = shape.attachNode = [];
            
            for(i in prim.attachNode){ 
                shape = prim.attachNode[i].curve;
                num = prim.attachNode[i].attrs.num;
                attachNode.push({id: shape.dash._id, num: num});
                /*
                curve = {};
                if(!tmp[shape.dash._id]){
                    pts = shape.attrs.points;
                    points = [];
                    for(k=0,l=pts.length; k<l; k++){
                        points[k] = {};
                        points[k].x = pts[k].x;
                        points[k].y = pts[k].y;
                    }
                    points[anchorAttrs.num].apId = anchorAttrs.attach.apId;
                    if(shape.ahchors[ 2 - anchorAttrs.num ].attrs.attach.attached){
                        points[ 2 - anchorAttrs.num ] = shape.ahchors[ 2 - anchorAttrs.num ].attrs.attach.apId;
                    }
                    
                    
                    curve.num = anchorAttrs.num;
                    curveConfig(curve, shape, points);
                    attachNode.push(curve);
                    tmp[shape.dash._id] = shape.anchors;
                }else{
                    
                }
                */
            }
        }
        
        curve = json['lines'] = {};
        curve.attach = {};
        curve.detach = {};
        for(i in lines){
            shape = lines[i];
            pts = shape.attrs.points;
            points = [];
            for(k=0,l=pts.length; k<l; k++){
                points[k] = {};
                points[k].x = pts[k].x;
                points[k].y = pts[k].y;
            }

            if(shape.src || shape.dst){
                if(shape.src){
                    points[0].apId = shape.anchors[0].attrs.attach.apId;
                }
                if(shape.dst){
                    points[2].apId = shape.anchors[2].attrs.attach.apId;
                }
                curve.attach[shape.dash._id] = {};
                curveConfig(curve.attach[shape.dash._id], shape, points);
            }else{
                curve.detach[shape.dash._id] = {};
                curveConfig(curve.detach[shape.dash._id], shape, points);
            }
        }
        return json;
    }
    util.toJson = toJson;
    
    function jsonToString (obj){   
        var THIS = this;    
        switch(typeof(obj)){   
            case 'string':   
                return '"' + obj.replace(/(["\\])/g, '\\$1') + '"';   
            case 'array':   
                return '[' + obj.map(THIS.jsonToString).join(',') + ']';   
            case 'object':   
                 if(obj instanceof Array){   
                    var strArr = [];   
                    var len = obj.length;   
                    for(var i=0; i<len; i++){   
                        strArr.push(THIS.jsonToString(obj[i]));   
                    }   
                    return '[' + strArr.join(',') + ']';   
                }else if(obj==null){   
                    return 'null';   
  
                }else{   
                    var string = [];   
                    for (var property in obj) string.push(THIS.jsonToString(property) + ':' + THIS.jsonToString(obj[property]));   
                    return '{' + string.join(',') + '}';   
                }   
            case 'number':   
                return obj;
            case 'boolean':
                return obj;            
            case false:   
                return obj;   
        }   
    }
    util.jsonToString = jsonToString;
    
    function stringToJSON(obj){   
        var js = eval("[" + obj+ "]" );
        return js[0];  
    } 
    util.stringToJSON = stringToJSON;
    

    function clear(stage){
        var i, attachPrim, prim, lines, line;
        stage.clear();
        attachPrim = stage.data.attachPrim;
        for(i in attachPrim){
            prim = attachPrim[i];
            prim.deleteFunc();
        }
        stage.data.attachPrim = {};
        
        lines = stage.data.lines;

        for(i in lines){
            line = lines[i];
            line.deleteFunc();
        }
        stage.data.lines = {};
    }
    util.clear = clear;
    
    function load(stage, json){
        var i, l, prim, type, retPrim, attachNode, retCurve, points, id, anchors, num, attach, lines, curve,
            tmp = {},
            data = stage.data,
            canvas = data.layer.canvas,
            bgAttrs = data.bg.attrs,
            util = gVar.util;

        if(!json || !json.canvas){
            return;
        }
        util.clear(stage);
         
        bgAttrs.width = canvas.width = json['canvas'].width,
        bgAttrs.height = canvas.height = json['canvas'].height;
        
        lines = json['lines'].detach;
        for(i in lines){
            retCurve = util.drawCurve(stage, lines[i].config, lines[i].properties);
            stage.data.lines[retCurve.dash._id] = retCurve;
        }
        retCurve = null;
                                
        for(i in json['prim']){
            prim = json['prim'][i];
            type = i.split('_')[0];

            switch(type){
                case '3':
                    retPrim = util.drawCircle(stage, prim.config, prim.properties);
                    break;
                case '4':
                    retPrim = util.drawStripe(stage, prim.config, prim.properties);
                    break;
                case '5':
                    retPrim = util.drawRect(stage, prim.config, prim.properties);
                    break;
                default:
                    break;
            }
            if(!retPrim){
                alert('load');
                return;
            }
            retPrim.blurFunc();

            attachNode = prim.attachNode;
            for(i=0,l=attachNode.length; i<l; i++){
                id = attachNode[i].id;
                curve =  json['lines'].attach[id];
                num = attachNode[i].num;
                if(!tmp[id]){
                    retCurve = util.drawCurve(stage, curve.config, curve.properties);
                    stage.data.lines[retCurve.dash._id] = retCurve;
                    anchors = retCurve.anchors;
                    tmp[id] = anchors; 
                }else{
                    anchors = tmp[id];
                } 
                attach = anchors[num].attrs.attach; 
                retPrim.attachNode[attach.attachId] = anchors[num];
                attach.attached = true;
                attach.primIndex = retPrim.attrs.attachId;
                anchors[num].attrs.fill = anchors[num].attrs.attachFill;
                attach.apId = curve.config.points[num].apId;
                
                if(num == 2){
                    anchors[num].curve.dst = retPrim;
                }else if(num == 0){
                    anchors[num].curve.src = retPrim;
                }  
                retCurve = null;                
            }
            retPrim= null;
        }
    }
    util.load = load;
    

    function blurFocus(self){ 
        var stage = self.getStage(),
            prim = stage.data.selPrim;
        if(prim == self){
            return;
        }
        if(prim && prim.blurFunc){
            prim.blurFunc();
        }
        
        stage.data.selPrim = self;
        if(self && self.focusFunc){
            self.focusFunc();
        }
    }
    util.blurFocus = blurFocus;

    function hideText(prim){
        var attachNode = prim.attachNode, j;
        for(j in attachNode){
            attachNode[j].curve.text.hide();
        }
    }
    util.hideText = hideText;

    
    function getMousePos(ev) { //////////////////////////////////////////////////////////////////////////////////
		if(ev.pageX || ev.pageY){ 
			return {x:ev.pageX, y:ev.pageY}; 
		} ;
		return { 
			x:ev.clientX + document.body.scrollLeft - document.body.clientLeft, 
			y:ev.clientY + document.body.scrollTop - document.body.clientTop 
		};
	}; 
    util.getMousePos = getMousePos;
    
    function stopBubble(oEvent){
        if(oEvent.stopPropagation){
            oEvent.stopPropagation();
        }else{
            oEvent.cancelBubble = true;
        }
        if(oEvent.preventDefault){
            oEvent.preventDefault();
        }else{
            oEvent.returnValue = false;
        }
    }
    util.stopBubble = stopBubble;
    
    /*
    function toDrawCurve(stage, flag){
         stage.data.line.toDrawLine = flag;
    }
    util.toDrawCurve = toDrawCurve;
    */
    
    function attr(that, key, value){
        if(typeof that['properties'] == 'undefined'){
            that['properties'] = {};
        }
        if(typeof value == 'undefined') {
            return that['properties'][key];
        }
        that['properties'][key] = value;

    }
    util.attr = attr;
    
    function getInLines(that){
        var i, attachNode, 
            curve = [];
        attachNode = that.attachNode;
        for(i in attachNode){
            if(attachNode[i].attrs.num == 2){
                curve.push(attachNode[i].curve);
            }
        }
        return curve;
    }
    util.getInLines = getInLines;
    
    function getOutLines(that){
        var i, attachNode, 
            curve = [];
        attachNode = that.attachNode;
        for(i in attachNode){
            if(attachNode[i].attrs.num == 0){
                curve.push(attachNode[i].curve);
            }
        }
        return curve;
    }
    util.getOutLines = getOutLines;
    
    function getAssociatedLines(that){
        var i, anchor, attachNode, num, attach,
            curve = [],
            tmp = {};
        attachNode = that.attachNode;
        for(i in attachNode){
            anchor = attachNode[i];
            num = anchor.attrs.num;
            if(tmp[anchor.attrs.attach.attachId]){
                continue;
            }
            attach = anchor.curve.anchors[2-num].attrs.attach;
            if(attach.attached && attach.primIndex == that.attrs.attachId){
                tmp[attach.attachId] = 1;
            }
            curve.push(anchor.curve);
        }
        return curve;
    }
    
    util.getAssociatedLines = getAssociatedLines;
    
    function getInPrims(that){
        var i, anchor, attachNode, num, curve, oEnd,
            prim = [],
            tmp = {};
        attachNode = that.attachNode;
        for(i in attachNode){
            anchor = attachNode[i];
            curve = anchor.curve;
            num = anchor.attrs.num;
            if(num == 2){
                oEnd = curve.src;
            }
            if(!oEnd || tmp[oEnd.attrs.attachId]){
                continue;
            }else{
                tmp[oEnd.attrs.attachId] = 1;
                prim.push(oEnd);
            }
        }
        return prim;
    }
    util.getInPrims = getInPrims;
    
    function getOutPrims(that){
        var i, anchor, attachNode, num, curve, oEnd,
            prim = [],
            tmp = {};
        attachNode = that.attachNode;
        for(i in attachNode){
            anchor = attachNode[i];
            curve = anchor.curve;
            num = anchor.attrs.num;
            if(num == 0){
                oEnd = curve.dst;
            }
            if(!oEnd || tmp[oEnd.attrs.attachId]){
                continue;
            }else{
                tmp[oEnd.attrs.attachId] = 1;
                prim.push(oEnd);
            }
        }
        return prim;
    }
    util.getOutPrims = getOutPrims;

    
    function getAssociatedPrims(that){
        var i, anchor, attachNode, num, curve, oEnd,
            prim = [],
            tmp = {};
        attachNode = that.attachNode;
        for(i in attachNode){
            anchor = attachNode[i];
            curve = anchor.curve;
            num = anchor.attrs.num;
            if(num == 0){
                oEnd = curve.dst;
            }else if(num == 2){
                oEnd = curve.src;
            }
            if(!oEnd || tmp[oEnd.attrs.attachId]){
                continue;
            }else{
                tmp[oEnd.attrs.attachId] = 1;
                prim.push(oEnd);
            }
        }
        return prim;
    }
    util.getAssociatedPrims = getAssociatedPrims;

    jQuery(document.body).bind("mouseup", function(evt) {
        var drag = Kinetic.Global.drag;
        if(drag.moving){
            var stage = drag.node.getStage(),
                data = stage.data,
                line = data.line,
                attrs = stage.attrs,
                con = attrs.container,
                w = attrs.width + con.offsetLeft - document.body.scrollLeft - document.documentElement.scrollLeft,
                h = attrs.height + con.offsetTop - document.body.scrollTop - document.documentElement.scrollTop,
                anchors, curve
 
            if(evt.clientX > w || evt.clientY > h){
                if(!line.flag  && line.toDrawLine){
                    anchors =  line.anchors;
                    if(anchors){
                        curve = anchors[0].curve;
                        data.lines[curve.dash._id] = curve;
                    }else{
                        util.log('bug');
                    }
                }
                line.flag = true;
                line.toDrawLine = false;
                
                stage._endDrag(evt);
                data.layer.draw();
                if(line.src){
                    line.src.attrs.dragBounds = {};
                }
                line.src = null;
                line.anchors = null;
            }
        }
    }, false);
    
    function setRightMenu(stage){
          var container = stage.attrs.container
            util = gVar.util; 
        container.oncontextmenu = function(e){
            util.stopBubble(e);

        var e = e || window.event;
        var pos = stage.mousePos;
        var prim = stage.data.selPrim;

        if(prim && prim.type && prim.intersects(pos)){
            stage.config.onRightClick({src: prim, e: e});
        }
        };
    }
    gVar.util.setRightMenu = setRightMenu;
   
   
})();
 
