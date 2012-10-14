(function(){
    
    var util = gVar.util;

    function focusFunc(){
        this.attrs.stroke = this.attrs.focusStroke;
        this.moveToTop();
        this.getLayer().draw();
    }
    
    function blurFunc(){
        this.attrs.stroke = this.attrs.blurStroke;
        this.getLayer().draw();
    }
    
    function setStyle(config){
        var circle,
            jq = jQuery;
        config = config || {};
        circle = config.circle;
        if(circle && circle.radius){
            config.circle.radius = {
                x: circle.radius,
                y: circle.radius
            }
        }
        jq.extend(this.attrs, circle);
        if(circle.stroke){
            this.attrs.blurStroke = circle.stroke;
        }
        console.log(this.attrs);
        this.getLayer().draw();
    }
    
    function intersects(pos){
        var attrs = this.attrs,
            x = attrs.x,
            y = attrs.y,
            r = attrs.radius.x;
            
        return Math.pow(pos.x-x, 2) + Math.pow(pos.y-y, 2)  <=  r*r;  
    }
    
    function nearPoint(anchor){
        var attrs = this.attrs,
            attachPoint = this.attachPoint;
            anchorAttrs = anchor.attrs,
            point = anchor.pt,
            attach = anchorAttrs.attach;

        this.attachNode[attach.attachId] = anchor;
        anchorAttrs.fill = anchorAttrs.attachFill;
        attach.primIndex = attrs.attachId;
        attach.apId = 0;
        attach.attached = true;
        
        anchorAttrs.x = attachPoint[0].x;
        anchorAttrs.y = attachPoint[0].y;

        point.x = anchorAttrs.x;
        point.y = anchorAttrs.y;
        
        if(anchorAttrs.num == 0){
            anchor.curve.src = this;
        }else if(anchorAttrs.num == 2){
            anchor.curve.dst = this;
        }
    }
     
    function deleteFunc (){
        var i, anchor, attach, src, dst,
            layer = this.getLayer(),
            attachNode = this.attachNode,
            data = this.getStage().data;
        
        this.off('mousedown');
        this.off('dblclick');
        this.off('mouseover');
        this.off('mouseout');
        this.off('dragstart');
        this.off('dragmove');
        this.off('dragend');
        
        delete this.focusFunc;
        delete this.blurFunc;
        delete this.setStyle;
        delete this.intersects;
        delete this.nearPoint;
        delete this.attr;
        delete this.getInLines;
        delete this.getOutLines;
        delete this.getAssociatedLines;
        delete this.getInPrims;
        delete this.getOutPrims;
        delete this.getAssociatedPrims;
        
        if(this.properties){
            delete this.properties;
        }

        for(i in attachNode){
            anchor = attachNode[i];
            src = anchor.curve.src;
            if(src && src.attrs.attachId == this.attrs.attachId){
                anchor.curve.src = null;
            }
            dst = anchor.curve.dst;
            if(dst && dst.attrs.attachId == this.attrs.attachId){
                anchor.curve.dst = null;
            }
            attach = anchor.attrs.attach;
            attach.attached = false;
            attach.primIndex = -1;
            anchor.attrs.fill = anchor.attrs.detachFill;
            delete attachNode[i];
        }
        delete this.attachNode;
        delete this.attachPoint;
        
        delete data.attachPrim[this.attrs.attachId]; 
        layer.remove(this);
        delete this.deleteFunc;
        delete this;
        data.selPrim = null;
        this.getLayer().draw();
     }

    function attr(key, value){
        return util.attr(this, key, value);
    }
    
    function getInLines(){
        return util.getInLines(this);
    }
    
    function getOutLines(){
        return util.getOutLines(this);
    }

    function getAssociatedLines(){
        return util.getAssociatedLines(this);
    }
    
    function getInPrims(){
        return util.getInPrims(this);
    }
    
    function getOutPrims(){
        return util.getOutPrims(this);
    }
    
    function getAssociatedPrims(){
        return util.getAssociatedPrims(this);
    }
    
    function drawCircle(stage, config, properties){
        var pos, option, circle,
            drawLineBug = false,
            jq = jQuery,
            data = stage.data,
            layer = data.layer;

        if(!stage){
            util.log('usage: drawCircle(stage, [config])');
            return;
        }
        
        //get draw pos
        config = config || {};
        if(typeof config.x == 'undefined'){
            pos = stage.mousePos || {x: 0, y: 0};
            config.x = pos.x;
            config.y = pos.y;
        }
        
        //default attr
        option = {
            radius: 20,
            fill: 'black',
            blurStroke: 'black',
            focusStroke: 'blue',
            strokeWidth: 1,
            draggable: true
        };

        jq.extend(option, config);

        circle = new Kinetic.Circle({
            x: option.x,
            y: option.y,
            radius: option.radius,
            fill: option.fill,
            stroke: option.blurStroke,
            blurStroke: option.blurStroke,
            focusStroke: option.focusStroke,
            strokeWidth: option.strokeWidth,
            attachId: data.count++,
            draggable: option.draggable
        });
        
        if(properties){
            circle.properties = properties;
        }


        circle.on('mousedown', function(){
            var line = data.line;
            if(line.toDrawLine && line.flag){//prepare to draw line, set bound to fix the circle
                var attrs = this.attrs,
                    x = attrs.x,
                    y = attrs.y;
                attrs.dragBounds = {
                    top: y,
                    bottom: y,
                    left: x,
                    right: x
                };
                return;
            }
            
            util.blurFocus(this);
        });
        
        circle.on('dblclick', function(e){
            stage.config.onDbClick({src: this, e: e});
        });
        
        circle.on('mouseover', function(e){
            stage.config.onMouseover({src: this, e: e});
        });
        
        circle.on('mouseout', function(e){
            stage.config.onMouseout({src: this, e: e});
        });

        
        circle.on('dragstart', function(){
            var line = data.line;
            if(line.toDrawLine && line.flag){//draw line
                drawLineBug = true;
                line.flag =false; //PDC
                line.src = this;

                util.drawCurve(this.getStage());
                
                var point,
                    anchor = line.anchors[0];

                if(anchor){//attach the start anchor
                    this.nearPoint(anchor);
                    line.anchors[1].hide();
                    point = anchor.pt;
                    point.x = anchor.attrs.x;
                    point.y = anchor.attrs.y;   
                }else{
                    util.log('bug');
                }
            }else{//drag circle
                var attachNode, i,
                    prim = data.attachPrim[this.attrs.attachId];
                if(prim){
                    attachNode = prim.attachNode;
                    for(i in attachNode){
                        attachNode[i].curve.text.hide();
                    }
                }else{
                    util.log('bug');
                }
            }
        });
        
        circle.on('dragmove', function(){
            if(data.line.toDrawLine){
                return;
            }

            var point, i,
                attachPoint = this.attachPoint,
                attachNode = this.attachNode;
                
            attachPoint[0].x  = this.attrs.x;
            attachPoint[0].y  = this.attrs.y;
                
            for(i in attachNode){
                point = attachNode[i].pt,
                apId = attachNode[i].attrs.attach.apId;
                //update curve    
                point.x = attachPoint[apId].x; 
                point.y = attachPoint[apId].y;
            } 
            this.getLayer().draw();          
        });
        
        circle.on('dragend', function(e){
            if(drawLineBug){
                drawLineBug = false;
                return;
            }

            var i, anchorAttrs, curve, text, point, attachNode, attachPoint,
                attrs = this.attrs,
                prim = data.attachPrim[attrs.attachId];
                
            if(prim){//prim == this
                attachNode = prim.attachNode;
                attachPoint = prim.attachPoint;
                attachPoint[0].x = this.attrs.x;
                attachPoint[0].y = this.attrs.y;
                
                for(i in attachNode){
                    anchorAttrs = attachNode[i].attrs,
                    curve = attachNode[i].curve
                    text = curve.text,
                    point = attachNode[i].pt
                    apId = anchorAttrs.attach.apId;
                        
                    //update anchor
                    anchorAttrs.x = attachPoint[apId].x;  
                    anchorAttrs.y = attachPoint[apId].y; 
                    //update curve
                    point.x = anchorAttrs.x;
                    point.y = anchorAttrs.y;
                    //update text
                    text.relocation(curve.anchors);
                    if(text.attrs.text != ""){
                        text.show();
                    }
                    curve.saveDot();
                }
            }else{
                util.log('bug');
            }
            stage.config.onDragEnd({src: this, e: e});
            this.getLayer().draw();
        });

        circle.attachPoint = [];
        circle.attachPoint[0] = {x: circle.attrs.x, y: circle.attrs.y};
        circle.attachNode = {};

        circle.focusFunc = focusFunc;
        circle.blurFunc = blurFunc; 
        circle.setStyle = setStyle;
        circle.intersects = intersects;        
        circle.nearPoint = nearPoint;
        circle.deleteFunc = deleteFunc;


        circle.attr = attr;
        circle.getInLines = getInLines;
        circle.getOutLines = getOutLines;
        circle.getAssociatedLines = getAssociatedLines;
        circle.getInPrims = getInPrims;
        circle.getOutPrims = getOutPrims;
        circle.getAssociatedPrims = getAssociatedPrims;
        circle.type = gVar.type.CIRCLE;
        
        data.attachPrim[circle.attrs.attachId] = circle; 

        layer.add(circle);
        util.blurFocus(circle);
        layer.draw();
        
        stage.config.onDraw({src: circle, e: {x: option.x, y: option.y}});
        
        return circle;
    }
    
    util.drawCircle = drawCircle;
})();