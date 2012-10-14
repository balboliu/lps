(function(){
    var util = gVar.util;

    function focusFunc(){
        var i, l,
            flexPoint = this.flexPoint;
        for(i=0,l=flexPoint.length; i<l; i++){
            flexPoint[i].moveToTop();
            flexPoint[i].show();
        }
        this.attrs.stroke = this.attrs.focusStroke;
        this.moveToTop();
        this.getLayer().draw();
    }
    
    function blurFunc(){
        var i, l,
            flexPoint = this.flexPoint;
        for(i=0,l=flexPoint.length; i<l; i++){
            flexPoint[i].hide();
        }
        this.attrs.stroke = this.attrs.blurStroke;
        this.getLayer().draw();
    }
    
    function setStyle(config){
        var jq = jQuery;
        config = config || {};
        jq.extend(this.attrs, config.stripe);
        if(config.stripe && config.stripe.stroke){
            this.attrs.blurStroke = config.stripe.stroke;
        }
        /*
        if(config.topAnchor && config.topAnchor.radius){
            config.topAnchor.radius = {
                x: config.topAnchor.radius,
                y: config.topAnchor.radius
            }
        }
        if(config.bottomAnchor && config.bottomAnchor.radius){
            config.bottomAnchor.radius = {
                x: config.bottomAnchor.radius,
                y: config.bottomAnchor.radius
            }
        }*/
        jq.extend(this.flexPoint[0].attrs, config.topAnchor);
        jq.extend(this.flexPoint[1].attrs, config.bottomAnchor);
        this.getLayer().draw();
    }


    function intersects(pos){
        var attrs = this.attrs,
            x = attrs.x,
            y = attrs.y,
            w = attrs.width,
            h = attrs.height;

        return !(pos.x < x || pos.x > x + w || pos.y < y || pos.y > y + h);
    }
    
    function nearPoint(anchor){
        var attrs = this.attrs,
            attachPoint = this.attachPoint,
            anchorAttrs =  anchor.attrs,
            point = anchor.pt,
            attach = anchorAttrs.attach,
            x = attrs.x,
            ax = anchorAttrs.x,
            ay = anchorAttrs.y,
            apNum = attrs.apNum,
            w = attrs.width,
            out = false,
            base = 0;

        if(ax - x > x + w - ax){//right
            base = apNum;
            if(ay <= attachPoint[apNum].y){
                out = true;
                base = apNum;
            }
            if(ay >= attachPoint[apNum-1].y){
                out = true;
                base = (apNum << 1) -1;
            }
        }else{
            if(ay <= attachPoint[0].y){
                out = true;
                base = 0;
            }
            if(ay >= attachPoint[apNum -1].y){
                out = true;
                base = apNum - 1;
            }
        }
        if(!out){
            while(attachPoint[base].y < ay){
                base++;
            }
            if(ay - attachPoint[base-1].y < attachPoint[base].y - ay){
                base--;
            }
        }

        this.attachNode[attach.attachId] = anchor;
        anchorAttrs.fill = anchorAttrs.attachFill;
        attach.primIndex = attrs.attachId;
        attach.apId = base;
        attach.attached = true;

        anchorAttrs.x = attachPoint[base].x;
        anchorAttrs.y = attachPoint[base].y;
        
        point.x = anchorAttrs.x;
        point.y = anchorAttrs.y;
        
        if(anchorAttrs.num == 0){
            anchor.curve.src = this;
        }else if(anchorAttrs.num == 2){
            anchor.curve.dst = this;
        }
    }
    
    function deleteFunc(){
        var i, anchor, attach, j, src, dst,
            layer = this.getLayer(),
            attachNode = this.attachNode,
            data = this.getStage().data,
            flexPoint = this.flexPoint;
        
        this.off('mousedown');
        this.off('dblclick');
        this.off('mouseover');
        this.off('mouseout');
        this.off('dblclick');
        this.off('dragstart');
        this.off('dragmove');
        this.off('dragend');
       
        if(this.properties){
            delete this.properties;
        }
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
        
        delete this.attachPoint;

        for(j=0; j<flexPoint.length; j++){
            delete flexPoint[j].attrs.stripe;
            flexPoint[j].off('mouseover');
            flexPoint[j].off('mouseout');
            flexPoint[j].off('dragstart');
            flexPoint[j].off('dragmove');
            flexPoint[j].off('dragend');
            
            flexPoint[j].hide();
            layer.remove(flexPoint[j]);
            delete flexPoint[j];
        }
        delete this.flexPoint;

        
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
        
        delete data.attachPrim[this.attrs.attachId]; 
        this.hide();
        layer.remove(this);
        delete this.deleteFunc;
        delete this;
        data.selPrim = null;
        layer.draw();
    }
    
    function saveAttachNode(stripe){
        var j, text, curve, anchors,
            attachNode = stripe.attachNode;
        for(j in attachNode){
            curve = attachNode[j].curve;
            text = curve.text;
            anchors = curve.anchors;

            text.relocation(anchors);
            if(text.attrs.text != ""){
                text.show();
            }
            stripe.getLayer().draw();
            curve.saveDot();
        }
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
         
    function drawStripe(stage, config, properties){
        var pos, option, stripe,
            drawLineBug = false,
            jq = jQuery,
            data = stage.data,
            layer = data.layer;
            
        if(!stage){
            //util.log('usgae: drawStripe(stage, [config])');
        }
        
        //get draw pos
        config = config || {};
        if(typeof config.x == 'undefined'){
            pos = stage.mousePos || {x: 0, y: 0};
            config.x = pos.x;
            config.y = pos.y;
        }
        
        if(config.minHeight < 150){
            config.minHeight = 150;
        }
        
        if(config.height < config.minHeight){
            config.height = config.minHeight;
        }

        
        option = {
            width: 30,
            height: 200,
            fill: 'black',
            blurStroke: 'black',
            focusStroke: 'blue',
            strokeWidth: 1,
            minHeight: 150,
            draggable: true,
            apNum: 5,
            anchorRadius: 3,
            anchorStroke: 'green',
            anchorFill: 'yellow',
            anchorStrokeWidth: 1
        }
        
        jq.extend(option, config);
        
        if(option.apNum < 1){
            //util.log('apNum');
            return;
        }
        
        stripe = new Kinetic.Rect({
            x: option.x,
            y: option.y,
            width: option.width,
            height: option.height,
            fill: option.fill,
            minHeight: option.minHeight, 
            stroke: option.blurStroke,
            blurStroke: option.blurStroke,
            focusStroke: option.focusStroke,
            strokeWidth: option.strokeWidth,
            draggable: option.draggable,
            attachId: data.count++,
            apNum: option.apNum //the total number of attach point is 2*apNum
        });
        
        if(properties){
            stripe.properties = properties;
        }
        
        stripe.on('mousedown', function(){
            var line = data.line;
            if(line.toDrawLine && line.flag){//prepare to draw line, set bound to fix the stripe
                var attrs= this.attrs,
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
        
        stripe.on('dblclick', function(e){
            stage.config.onDbClick({src: this, e: e});
        });
        
        stripe.on('mouseover', function(e){
            stage.config.onMouseover({src: this, e: e});
        });
        
        stripe.on('mouseout', function(e){
            stage.config.onMouseout({src: this, e: e});
        });
        
        
        stripe.on('dragstart', function(){
            var anchor, point, flexPoint, i, l;
            line = data.line;
            if(line.toDrawLine && line.flag){//draw line
                line.flag =false; //PDC
                line.src = this;
                drawLineBug = true;

                util.drawCurve(this.getStage());
                
                anchor = line.anchors[0];
                if(anchor){
                    this.nearPoint(anchor);
                    line.anchors[1].hide();
                    point = line.anchors[1].pt;
                    point.x = anchor.attrs.x;
                    point.y = anchor.attrs.y;
                }else{
                    //util.log('bug');
                }
            }else{//drag rect
                flexPoint = this.flexPoint;
                for(i=0,l=flexPoint.length; i<l; i++){
                    flexPoint[i].hide();
                }
                
                util.hideText(this);  
            }
        });
        
        stripe.on('dragmove', function(){
            if(data.line.toDrawLine){
                return;
            }

            var i, j, anchor, anchorAttrs, apId, point,
                attachPoint = this.attachPoint,
                attachNode = this.attachNode,
                attrs = this.attrs,
                x = attrs.x,
                y = attrs.y,
                w = attrs.width,
                apNum = attrs.apNum,
                ah = attrs.ah,
                ax = x,
                ay = y; 

            
            for(i=0,l=attachPoint.length; i<l; i++){
                if(i > apNum-1){
                    ax = x + w;
                } 
                //update attach point
                ay =  y + (i%apNum)*ah;
                attachPoint[i].x = ax;
                attachPoint[i].y = ay;
            } 
            
            //update attach node
            for(j in attachNode){
                anchor = attachNode[j];
                anchorAttrs = anchor.attrs;
                apId = anchorAttrs.attach.apId;
                point = anchor.pt;

                anchorAttrs.x =  attachPoint[apId].x; 
                anchorAttrs.y =  attachPoint[apId].y; 

                point.x = anchorAttrs.x;
                point.y = anchorAttrs.y;
            }
            
            this.getLayer().draw();
        });
        
        stripe.on('dragend', function(e){
            if(drawLineBug){
                drawLineBug = false;
                return;
            }

            var attrs = this.attrs,
                x = attrs.x,
                y = attrs.y,
                w = attrs.width,
                h = attrs.height,
                flexPoint = this.flexPoint,
                attachPoint = this.attachPoint,
                i, l;
             
            //show flexPoint
            for(i=0,l=flexPoint.length; i<l; i++){
                flexPoint[i].attrs.x = x + (w >> 1);
                flexPoint[i].attrs.y = i? y+h : y;
                flexPoint[i].show();
            }

            saveAttachNode(stripe);
            stage.config.onDragEnd({src: this, e: e});
            layer.draw();
        });

        stripe.attachPoint = [];
        (function(){// compute attach point
            var ax, ah, ay, i, l,
                attrs = stripe.attrs,
                x = attrs.x,
                y = attrs.y,
                apNum = attrs.apNum,
                w = attrs.width,
                h = attrs.height,
                attachPoint = stripe.attachPoint;
           
            attrs.ah = parseInt(h/(apNum-1));
            for(i=0,l=apNum+apNum; i<l; i++){
                ax = x;
                ah = attrs.ah;
                ay = y;
                if(i > apNum-1){
                    ax = x + w;
                }
                attachPoint[i] = {
                    x: ax,
                    y: ay + (i%apNum)*ah
                }
            }
        })();
       
        
        //draw flex point
        stripe.flexPoint = [];
        (function(){
            var attrs = stripe.attrs,
                flexPoint = stripe.flexPoint,
                x = attrs.x,
                y = attrs.y,
                w = attrs.width,
                h = attrs.height;
            x = x + (w>>1);
            for(var i=0; i<2; i++){
                var top = i?attrs.y + attrs.minHeight : 0;
                var bottom = i? stage.getHeight() : attrs.y + h - attrs.minHeight;
                
                y = y + i*h;
                flexPoint[i] = new Kinetic.Circle({
                    x: x,
                    y: y,
                    stripe: stripe,
                    radius: option.anchorRadius,
                    num: i,
                    stroke: option.anchorStroke,
                    fill: option.anchorFill,
                    strokeWidth: option.anchorStrokeWidth,
                    draggable: option.draggable,
                    dragConstraint: "vertical",
                    dragBounds: {
                        top: top,
                        bottom: bottom
                    }
                });
                
                flexPoint[i].on("mouseover", function() {
                    document.body.style.cursor = "n-resize";
                    this.setStrokeWidth(option.anchorRadius  + 1);
                    layer.draw();
                });
                
                flexPoint[i].on("mouseout", function() {
                    document.body.style.cursor = "default";
                    this.setStrokeWidth(option.anchorRadius - 1);
                    layer.draw();
                });
                
                flexPoint[i].on("dragstart", function() {
                    util.hideText(this.attrs.stripe);
                });
                
                flexPoint[i].on("dragmove", function() {
                    var i, j, stripeX, stripeY, attachPoint, apNum, ah, attachNode,
                        anchor, anchorAttrs, apId, point,
                        attrs = this.attrs,
                        stripeAttrs = attrs.stripe.attrs,
                        dif = attrs.y - stripeAttrs.y;
     
                    //update stripe
                    if(attrs.num){
                        stripeAttrs.height = dif;
                    }else{
                        stripeAttrs.y = attrs.y;
                        stripeAttrs.height = stripeAttrs.height - dif;   
                    }
                    
                    
                    stripeX = stripeAttrs.x;
                    stripeY = stripeAttrs.y;
                    attachPoint = attrs.stripe.attachPoint;
                    apNum = stripeAttrs.apNum;
                    ah = parseInt(stripeAttrs.height/(apNum-1));
                     
                    for(var i=0,l=attachPoint.length; i<l; i++){
                        attachPoint[i].x = i > apNum-1 ? stripeX + stripeAttrs.width : stripeX;
                        attachPoint[i].y =  stripeY + (i%apNum)*ah;
                    }
                    
                    //update attachNode
                    attachNode = attrs.stripe.attachNode;
                    for(j in attachNode){
                        anchor = attachNode[j];
                        anchorAttrs = anchor.attrs;
                        apId = anchorAttrs.attach.apId;
                        point = anchor.pt;
                            
                        anchorAttrs.x =  attachPoint[apId].x;
                        anchorAttrs.y =  attachPoint[apId].y;
                        
                        point.x = anchorAttrs.x
                        point.y = anchorAttrs.y;
                    }

                    layer.draw();
                });
                
                flexPoint[i].on("dragend", function(e) {
                    var attrs = this.attrs,
                        stripeAttrs = attrs.stripe.attrs,
                        dragBounds = attrs.stripe.flexPoint[1- attrs.num].attrs.dragBounds,
                        x = stripeAttrs.x,
                        y = stripeAttrs.y,
                        w = stripeAttrs.width,
                        h = stripeAttrs.height,
                        apNum = stripeAttrs.apNum;
                        
                    if(attrs.num){
                        dragBounds.bottom = stripeAttrs.y + stripeAttrs.height - stripeAttrs.minHeight;
                    }else{
                        dragBounds.top = stripeAttrs.y + stripeAttrs.minHeight;
                    }    
                            
                    stripeAttrs.ah = parseInt(h/(apNum-1));
                    saveAttachNode(attrs.stripe);
                    stage.config.onDragEnd({src: attrs.stripe, e: e});
                });
                
                layer.add(flexPoint[i]);
                flexPoint[i].hide();

            }
        })();
        
        stripe.attachNode = {};
        
        stripe.focusFunc = focusFunc;   
        stripe.blurFunc = blurFunc;
        stripe.setStyle = setStyle;
        stripe.intersects = intersects;
        stripe.nearPoint = nearPoint;
        stripe.deleteFunc = deleteFunc;
        
        stripe.attr = attr;
        stripe.getInLines = getInLines;
        stripe.getOutLines = getOutLines;
        stripe.getAssociatedLines = getAssociatedLines;
        stripe.getInPrims = getInPrims;
        stripe.getOutPrims = getOutPrims;
        stripe.getAssociatedPrims = getAssociatedPrims;
        stripe.type = gVar.type.STRIPE;
        
        data.attachPrim[stripe.attrs.attachId] = stripe;
        
        layer.add(stripe);
        util.blurFocus(stripe);
        layer.draw();
        
        stage.config.onDraw({src: stripe, e: {x: option.x, y: option.y}});
        
        return stripe;
    }
    
    util.drawStripe = drawStripe;
})();
      