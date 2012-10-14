(function(){

    var util = gVar.util;
        
    function focusFunc(){
        this.attrs.stroke = this.attrs.focusStroke;
        this.leftTopTxt.moveToTop();
        this.rightTopTxt.moveToTop();
        this.moveToTop();
        this.getLayer().draw();
    }
    
    function blurFunc(){
        this.attrs.stroke = this.attrs.blurStroke;
        this.getLayer().draw();
    }
    
    function setStyle(config){
        var jq = jQuery;
        config = config || {};
        jq.extend(this.attrs, config.rect);
        jq.extend(this.leftTopTxt.attrs, config.ltText);
        jq.extend(this.rightTopTxt.attrs, config.rtText);
        
        if(config.rect && config.rect.stroke){
            this.attrs.blurStroke = config.rect.stroke;
        }
        /*
        if( typeof config.ltText.text != 'undefined'){
            this.leftTopTxt.setText(config.ltText.text + '');
        }
        if( typeof config.rtText.text != 'undefined'){
            this.rightTopTxt.setText(config.rtText.text + '');
        }
        
        if(config.ltText.height){
            this.leftTopTxt.setHeight(config.ltText.height);
            this.leftTopTxt.attrs.y = this.attrs.y - this.leftTopTxt.attrs.height; 
        }
        if(config.ltText.width){
            this.leftTopTxt.setWidth(config.ltText.width);
        }
        if(config.rtText.height){
            this.rightTopTxt.setHeight(config.rtText.height);
            this.rightTopTxt.attrs.y = this.attrs.y - this.rightTopTxt.attrs.height; 
        }
        if(config.rtText.width){
            this.rightTopTxt.setWidth(config.rtText.width);
            this.rightTopTxt.attrs.x = this.attrs.x + this.attrs.width - this.rightTopTxt.attrs.width; 
        }
        if(config.rect.height){
            this.setHeight(config.rect.height);
        }
        if(config.rect.width){
            this.setWidth(config.rect.width);
            this.rightTopTxt.attrs.x = this.attrs.x + this.attrs.width - this.rightTopTxt.attrs.width; 
        }
        */
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
            anchorAttrs = anchor.attrs,
            point = anchor.pt,
            attach = anchorAttrs.attach,
            x = attrs.x,
            y = attrs.y,
            w = attrs.width,
            h = attrs.height,
            ax =  anchorAttrs.x,
            ay = anchorAttrs.y,
            base = 0;
            
        if(ax < x + (w >> 2)){//left
            if(ay > y + h - (h >> 2)){// bottom
                base = 5;
            }else if(ay > y + (h >> 2)){//middle
                base = 3;
            }
        }else if(ax < x + w - (w >> 2)) {//middle
            if(ay < y + (h >> 1)){//top
                base = 1;
            }else{ //bottom
                base = 6;
            }
        }else{//right
            if(ay > y + h - (h >> 2)){// bottom
                base = 7;
            }else if(ay > y + (h >> 2)){//middle
                base = 4;
            }else{//top
                base = 2;
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

    function editRectTxt(config){
        config = config || {};
        if(config.text && typeof config.text.text != 'undefined'){
            this.setText(config.text.text + '');
        }
        if(config.ltText && typeof config.ltText.text != 'undefined'){
            this.leftTopTxt.setText(config.ltText.text + '');
        }
        if(config.rtText && typeof config.rtText.text != 'undefined'){
            this.rightTopTxt.setText(config.rtText.text + '');
        }
        this.getLayer().draw();
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
        delete this.editFunc;
        delete this.attr;
        delete this.getInLines;
        delete this.getOutLines;
        delete this.getAssociatedLines;
        delete this.getInPrims;
        delete this.getOutPrims;
        delete this.getAssociatedPrims;
        
        delete this.attachPoint;

        if(this.properties){
            delete this.properties;
        }
        delete this.leftTopTxt.attrs.rect;
        delete this.rightTopTxt.attrs.rect;
        layer.remove(this.leftTopTxt);
        layer.remove(this.rightTopTxt);
        delete this.leftTopTxt;
        delete this.rightTopTxt;
        
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
        
        delete data.attachPrim[this.attrs.attachId]; 
        this.hide();
        layer.remove(this);
        delete this.deleteFunc;
        delete this;
        data.selPrim = null;
        layer.draw();
     }

    function attr(key, value){
        console.log(key, value);
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

    /*function highlight(flag){
        if(flag){
        }else{
        }
    }*/
     //draw text rect
    function drawRect(stage, config, properties){
        var pos, option, rect, leftTopTxt, rightTopTxt,
            drawLineBug = false,
            jq = jQuery,
            data = stage.data,
            layer = data.layer;
            
        if(!stage){
            //util.log('usgae: drawrect(stage, [config])');
        }
        
        //get draw pos
        config = config || {};
        if(typeof config.x == 'undefined'){
            pos = stage.mousePos || {x: 0, y: 0};
            config.x = pos.x;
            config.y = pos.y;
        }
        
        option = {
            text: '',
            width: 100,
            height: 70,
            align: 'center',
            fontSize: 14,
            fontFamily: "Calibri",
            fill: 'white',
            padding : 10,
            blurStroke: 'black',
            focusStroke: 'blue',
            strokeWidth: 1,
            textFill: 'green',
            draggable: true,
            
            ltHeight: 15, 
            ltText: '', 
            ltWidth : 20,
            ltAlign: 'left',
            ltFontSize: 12,
            ltFontFamily: "Calibri",
            ltFill: 'white',
            ltPadding : 0,
            ltStroke: 'white',
            ltTextFill: 'green',
            ltStrokeWidth: 1,

            rtText: '', 
            rtHeight: 15, 
            rtWidth : 20,
            rtAlign: 'right',
            rtFontSize: 12,
            rtFontFamily: "Calibri",
            rtFill: 'white',
            rtPadding: 0,
            rtStroke: 'white',
            rtStrokeWidth: 1,
            rtTextFill: 'green'
        };
        
        jq.extend(option, config);
        
        rect = new Kinetic.Text({
            x: option.x,
            y: option.y,
            text: option.text,
            width: option.width,
            height: option.height,/////////////////////
            align: option.align,
            fontSize: option.fontSize,
            fontFamily: option.fontFamily,
            fill: option.fill,
            padding : option.padding,
            stroke: option.blurStroke,
            blurStroke: option.blurStroke,
            focusStroke: option.focusStroke,
            strokeWidth: option.strokeWidth,
            textFill: option.textFill,
            attachId: data.count++,
            draggable: option.draggable
        });
        
        if(properties){
            rect.properties = properties;
        }
        
      
        rect.on('mousedown', function(){
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
        
        rect.on('dblclick', function(e){
            stage.config.onDbClick({src: this, e: e});
        });
        
        rect.on('mouseover', function(e){
            stage.config.onMouseover({src: this, e: e});
        });
        
        rect.on('mouseout', function(e){
            stage.config.onMouseout({src: this, e: e});
        });
     
        rect.on('dragstart', function(){
            var point, anchor,
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
            }else{
                this.leftTopTxt.hide();
                this.rightTopTxt.hide();
                util.hideText(this);//hide all text on curve
            }
        });
   
        rect.on('dragmove', function(){
            if(data.line.toDrawLine){
                return;
            }
            
            var i, l, anchor, anchorAttrs, apId, point,
                attrs = this.attrs,
                leftTxt = this.leftTopTxt,
                lattrs = leftTxt.attrs,
                rightTxt = this.rightTopTxt,
                rattrs = rightTxt.attrs,
                ox = lattrs.x,
                oy = lattrs.y + lattrs.height,
                dx = attrs.x -ox,
                dy = attrs.y - oy,
                attachPoint = this.attachPoint,
                attachNode = this.attachNode;
                
                
            lattrs.x += dx;
            lattrs.y += dy;
            rattrs.x += dx;
            rattrs.y += dy;

            for(i=0,l=attachPoint.length; i<l; i++){
                //update attachPoint
                attachPoint[i].x += dx;
                attachPoint[i].y += dy;  
            } 
            //update curve
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
        });
        
        
        rect.on('dragend', function(e){
            if(drawLineBug){
                drawLineBug = false;
                return;
            }
            var i, l, anchor, anchorAttrs, curve, text, point,
                attrs = this.attrs,
                leftTxt = this.leftTopTxt,
                lattrs = leftTxt.attrs,
                rightTxt = this.rightTopTxt,
                rattrs = rightTxt.attrs,
                ox = lattrs.x,
                oy = lattrs.y + lattrs.height,
                dx = attrs.x - ox,
                dy = attrs.y - oy,
                attachPoint = this.attachPoint,
                attachNode = this.attachNode;
                
            

            lattrs.x += dx;
            lattrs.y += dy;
            rattrs.x += dx;
            rattrs.y += dy;
            leftTxt.show();
            rightTxt.show();

            for(i=0,l=attachPoint.length; i<l; i++){
                //update attachPoint
                attachPoint[i].x += dx;
                attachPoint[i].y += dy;
            }
            
            //update curve
            for(i in attachNode){
                anchor = attachNode[i];
                anchorAttrs = anchor.attrs;
                curve = anchor.curve;
                text = curve.text;
                point = anchor.pt;
                    
                anchorAttrs.x +=  dx;
                anchorAttrs.y +=  dy;
                
                point.x += dx;
                point.y += dy;
                
                text.relocation(curve.anchors);
                if(text.attrs.text != ""){
                    text.show();
                }
                curve.saveDot();
            }
            
            stage.config.onDragEnd({src: this, e: e});
            layer.draw();
        });
     
        
        
        leftTopTxt = new Kinetic.Text({
            x: option.x,
            y: option.y - option.ltHeight,
            text: option.ltText,
            width : option.ltWidth,
            height: option.ltHeight,//todo
            align: option.Align,
            fontSize: option.ltFontSize,
            fontFamily: option.ltFontFamily,
            fill: option.ltFill,
            padding : option.ltPadding,
            stroke: option.ltStroke,
            strokeWidth: option.ltSrokeWidth,
            textFill: option.ltTextFill,
            rect: rect
        });
       // console.log('l',leftTopTxt.attrs.x,leftTopTxt.attrs.y);
        
        rightTopTxt = new Kinetic.Text({
            x: option.x + rect.attrs.width - option.rtWidth,
            y: option.y - option.rtHeight,
            text: option.rtText,
            width : option.rtWidth,
            height: option.rtHeight,//todo
            align: option.rtAlign,
            fontSize: option.rtFontSize,
            fontFamily: option.rtFontFamily,
            fill: option.rtFill,
            padding : option.rtPadding,
            stroke: option.rtStroke,
            strokeWidth: option.rtStrokeWidth,
            textFill: option.rtTextFill,
            rect: rect
        });
        

        leftTopTxt.on('mousedown', function(e){
            util.blurFocus(this.attrs.rect);
        });
        
        rightTopTxt.on('mousedown', function(e){
            util.blurFocus(this.attrs.rect);
        });
        
        rect.attachPoint = [];
        (function(){// compute attach point
            var i
                attrs = rect.attrs,
                attachPoint = rect.attachPoint,
                x = attrs.x,
                y = attrs.y,
                w = attrs.width,
                h = attrs.height,
                tmp = 0;
                
            w = w>>1;
            h = h>>1;

            for(i=0; i<3; i++){
                for(var j=0; j<3; j++){
                    if(i==1 && j==1){
                        continue;
                    }
                    attachPoint[tmp] = {
                        x: x + j*w,
                        y: y + i*h
                    };
                    tmp++;
                }
            }
        })();
        
        
        
        rect.leftTopTxt = leftTopTxt;
        rect.rightTopTxt = rightTopTxt;
        rect.attachNode = {};
        
        rect.focusFunc = focusFunc;
        rect.blurFunc = blurFunc;
        rect.setStyle = setStyle;
        rect.intersects = intersects;
        rect.nearPoint =  nearPoint;
        rect.deleteFunc = deleteFunc;
        rect.editFunc = editRectTxt;
        
        rect.attr = attr;
        rect.getInLines = getInLines;
        rect.getOutLines = getOutLines;
        rect.getAssociatedLines = getAssociatedLines;
        rect.getInPrims = getInPrims;
        rect.getOutPrims = getOutPrims;
        rect.getAssociatedPrims = getAssociatedPrims;
        rect.type = gVar.type.RECT;

        data.attachPrim[rect.attrs.attachId] = rect;

        layer.add(rightTopTxt);
        layer.add(leftTopTxt);
        layer.add(rect);
        util.blurFocus(rect);
        layer.draw();
        
        stage.config.onDraw({src: rect, e: {x: option.x, y: option.y}});
        
        return rect;
    }
    
    util.drawRect = drawRect;
    
})();
