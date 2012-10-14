(function () {
    var util = gVar.util;
    
    function setStyle(config){
    
        var jq = jQuery;
        config = config || {};
        
        jq.extend(this.attrs, config.curve);
        jq.extend(this.dash.attrs, config.dash);
        jq.extend(this.arrow.attrs, config.arrow);
        jq.extend(this.text.attrs, config.text);
        /*
        config.text = config.text || {};
        if( typeof config.text.text != 'undefined'){
            this.text.setText(config.text.text + '');
        }

        if(config.text.height){
            this.text.setHeight(config.text.height);
        }
        if(config.text.width){
            this.text.setWidth(config.text.width);
        }
        if(config.startAnchor && config.startAnchor.radius){
            config.startAnchor.radius = {
                x: config.startAnchor.radius,
                y: config.startAnchor.radius
            }
        }
        if(config.centerAnchor && config.centerAnchor.radius){
            config.centerAnchor.radius = {
                x: config.centerAnchor.radius,
                y: config.centerAnchor.radius
            }
        }
        if(config.endAnchor && config.endAnchor.radius){
            config.endAnchor.radius = {
                x: config.endAnchor.radius,
                y: config.endAnchor.radius
            }
        }
        */
        if(config.anchor && config.anchor.fill){
            this.anchors[0].attrs.detachFill = config.anchor.fill;
            this.anchors[2].attrs.detachFill = config.anchor.fill;
        }
        if(config.curve && config.curve.type){
            if(config.curve.type == 'dot'){
                this.setDot(true);
            }else if(config.curve.type == 'dot'){
                this.setDot(false);
            }
        }

        jq.extend(this.anchors[0].attrs, config.anchor);
        jq.extend(this.anchors[1].attrs, config.anchor);
        jq.extend(this.anchors[2].attrs, config.anchor);
        this.getLayer().draw();
    }
    function relocation(q){
        var sx = q[0].attrs.x,
            sy = q[0].attrs.y,
            cx = q[1].attrs.x,
            cy = q[1].attrs.y,
            ex = q[2].attrs.x,
            ey = q[2].attrs.y;
            
        this.attrs.x = 0.25*(sx + 2*cx + ex);
        this.attrs.y = 0.25*(sy + 2*cy + ey);   
    }
    
    function moveToTop(){
        this.text.moveToTop();
        this.dash.moveToTop();
        this.moveToTop();
        this.arrow.moveToTop();
        this.anchors[0].moveToTop();
        this.anchors[1].moveToTop();
        this.anchors[2].moveToTop();
        
    }
    
    function curveDelete(){
        this.curve.deleteFunc();
    }
    
    function attr(key, value){
        return util.attr(this, key, value);
    }
    
    function deleteFunc(){////////////////////////////////////////////////////////////////
                    
        var i, attach,
            dash = this.dash,
            layer = dash.getLayer(),
            data = dash.getStage().data,
            text = this.text,
            arrow = this.arrow,
            anchors = this.anchors;
         
        if(data.lines[dash._id]){
            delete data.lines[dash._id];
        }
        delete dash.curve;
        delete dash.attrs.points;
        delete dash.attrs.dashArray;
        layer.remove(dash);
        delete this.dash;
        
        delete text.curve;
        text.off('mousedown');
        text.off('dblclick');
        text.off('mouseover');
        text.off('mouseout');
        delete text.relocation;
        delete text.deleteFunc;
        layer.remove(text);
        delete this.text;

        delete arrow.curve;
        arrow.off('mousedown');
        arrow.off('dragstart');
        arrow.off('dragmove');
        arrow.off('dragend');
        delete arrow.attrs.points;
        delete arrow.pt;
        delete arrow.anchorAttr;
        delete arrow.deleteFunc;
        layer.remove(arrow);
        delete this.arrow;

        delete anchors[2].dragmove;
        delete anchors[2].dragend;
        for(i=0; i<anchors.length; i++){
            delete anchors[i].curve;
            delete anchors[i].pt;
            attach = anchors[i].attrs.attach;
            if(attach.attached){
                delete data.attachPrim[attach.primIndex].attachNode[attach.attachId];
                attach.attached = false        
            }
            delete anchors[i].attrs.attach;
            
            anchors[i].off('mouseover');
            anchors[i].off('mouseout');
            anchors[i].off('dragstart');
            anchors[i].off('dragmove');
            anchors[i].off('dragend');

            delete anchors[i].deleteFunc;
            layer.remove(anchors[i]);
            delete this.anchors[i];
        }
        delete this.anchors;
        

        this.off('mousedown');
        this.off('dblclick');
        this.off('mouseover');
        this.off('mouseout');
        this.off('dragstart');
        this.off('dragend');
        
        layer.remove(this);
        if(this.properties){
            delete this.properties;
        }
        delete this.setStyle;
        delete this.deleteFunc;
        delete this.top;
        delete this.src;
        delete this.dst;
        delete this.editFunc;
        delete this.attr;
        delete this.getEndsPrims;
        
        data.selPrim = null;
        
        layer.draw();
        delete this;
    }
    
    
    function editFunc(config){
        if(typeof config.text != 'undefined'){
            this.text.setText(config.text + '');
            this.text.show();
            this.getLayer().draw();
        }
    }
    
    
    function getEndsPrims(){
        return {src: this.src, dst: this.dst};
    }
    
    function drawCurve(stage, config, properties){
        var pos, option, curve, anchorPos, pts,
            data = stage.data,
            jq = jQuery,
            layer = data.layer;

        
        option = {
            type: 'solid',
            curveStroke: 'black',
            curveStrokeWidth: 1,
            draggable: true,
            
            dashArray: [1, 10, 0, 1],
            dashStroke: 'black',
            dashStrokeWidth: 1,
            dashLineCap: "round",
            
            text: '',
            textWidth : 50,
            textHeight: 15,
            textAlign: 'left',
            textPadding: 0,
            textFontSize: 12,
            textFontFamily: "Calibri",
            textFill: 'green',
            
            arrowSizeX: 12,
            arrowSizeY: 10,
            arrowFill: 'black',
            arrowStroke: 'black',
            arrowStrokeWidth: 1,
            
            anchorRadius: 3, 
            anchorStroke: 'green',
            anchorDetachFill: 'yellow',
            anchorAttachFill: 'red',
            anchorStrokeWidth: 1
        };
        
        
        config = config || stage.data.config || {};
 
        jq.extend(option, config);
        
        //get draw pos
        if(typeof config.points == 'undefined'){
            pos = stage.mousePos || {x: 0, y: 0};
            anchorPos =[{x:pos.x, y:pos.y}, {x:pos.x, y:pos.y},{x:pos.x, y:pos.y}]; 
        }else{
            pts = config.points;
            anchorPos = [
                {x: pts[0]['x'], y: pts[0]['y']}, 
                {x: pts[1]['x'], y: pts[1]['y']}, 
                {x: pts[2]['x'], y: pts[2]['y']}
            ];
        }

        curve = new Kinetic.QuadraticCurve({
            points: anchorPos,
            type: option.type,
            stroke: option.curveStroke,
            draggable: option.draggable
        });
        
        if(properties){
            curve.properties = properties;
        }

        
        //draw dashLine
        curve.dash = new Kinetic.Line({
            points: anchorPos,
            dashArray: option.dashArray,
            strokeWidth: option.strokeWidth,
            stroke: option.dashStroke,
            lineCap: option.dashLineCap
        });
        curve.dash.curve = curve;

        //draw text
        curve.text = new Kinetic.Text({
            x: (anchorPos[0].x + anchorPos[2].x)>>1,
            y: (anchorPos[0].y + anchorPos[2].y)>>1,
            text: option.text,
            width : option.textWidth,
            height: option.textHeight,
            align: option.textAlign,
            padding: option.textPadding,
            fontSize: option.textFontSize,
            fontFamily: option.textFontFamily,
            textFill: option.textFill
        });
        curve.text.curve = curve;
        curve.text.relocation = relocation;
        curve.text.deleteFunc = curveDelete;
        if(curve.text.attrs.text == ""){
            curve.text.hide();
        }
        
      
        
        curve.text.on('mousedown', function(){
            if(this.attrs.visible){
                util.blurFocus(this.curve);
                this.curve.top();
                this.getLayer().draw();
            }
        });
        
        curve.text.on('dblclick', function(e){
            stage.config.onDbClick({src: this.curve, e: e});
        });
        
        curve.text.on('mouseover', function(e){
            stage.config.onMouseover({src:this.curve, e: e});
        });
        
        curve.text.on('mouseout', function(e){
            stage.config.onMouseout({src: this.curve, e: e}); 
        });
        
        //draw arrow
        curve.arrow = new Kinetic.Arrow({
            points: anchorPos,
            sizeX: option.arrowSizeX,
            sizeY: option.arrowSizeY,
            lx: 0, //lastx
            ly: 0, //lasty
            stroke: option.arrowStroke,
            strokeWidth: option.arrowStrokeWidth,
            fill: option.arrowFill,
            draggable: option.draggable
        });
        curve.arrow.curve = curve;
        curve.arrow.pt = anchorPos[2];//cache
        curve.arrow.deleteFunc = curveDelete;
        
        curve.arrow.on('mousedown', function(){
            util.blurFocus(this.curve);
            this.curve.top();
            this.getLayer().draw();
        });
        
        curve.arrow.on('dragstart', function(){
            var attrs = this.attrs;
            this.hide();
            attrs.lx = attrs.x;
            attrs.ly = attrs.y;
            this.curve.text.hide();
        });
        
        curve.arrow.on('dragmove', function(e){
            var attrs = this.attrs,
                point = this.pt,
                anchorAttr = this.anchorAttr;
            //update anchor    
            anchorAttr.x += attrs.x - attrs.lx;
            anchorAttr.y += attrs.y - attrs.ly;
            attrs.lx = attrs.x;
            attrs.ly = attrs.y;
            //update curve
            point.x = anchorAttr.x;
            point.y = anchorAttr.y;
            
            attrs.x = attrs.y = 0;
            
          
            //check attach
            var i, prim,
                pos = stage.mousePos,
                attach = anchorAttr.attach,
                attachPrim = data.attachPrim;
                
            if(attach.attached){
                prim = attachPrim[attach.primIndex];
                if(!prim.intersects(pos)){
                    delete prim.attachNode[attach.attachId];
                    anchorAttr.fill = anchorAttr.detachFill;
                    attach.attached = false;
                }
            }else{
                for(i in attachPrim){
                    prim = attachPrim[i];
                    if(prim.intersects(pos)){
                        prim.attachNode[attach.attachId] = this.curve.anchors[2];
                        attach.primIndex = i;
                        anchorAttr.fill = anchorAttr.attachFill;
                        attach.attached = true;
                        break;
                    }
                }
            }
        });
        
        curve.arrow.on('dragend', function(e){
            var prim,
                curve = this.curve,
                text = curve.text,
                anchors = curve.anchors;

            var attach = this.anchorAttr.attach,
                attachPrim = data.attachPrim;
            if(!attach.attached){
                prim = attachPrim[attach.primIndex];
                if(prim){
                    curve.dst = null;
                    delete prim.attachNode[attach.attachId];
                }
            }else{
                prim = attachPrim[attach.primIndex];
                if(prim){
                    if(prim.nearPoint){
                        prim.nearPoint(curve.anchors[2]);
                        curve.dst = prim;
                    }
                }else{
                    //util.log('bug');
                    attach.attached = false;
                }
            }   
            //update text
            text.relocation(curve.anchors);
            if(text.attrs.text != ""){
                text.show();
            }
            this.show();
            this.getStage().config.onDragEnd({src: curve, e: e});
            this.getLayer().draw();
            curve.saveDot();
        });

        
        
        //draw anchor and bind event
        function dragmove(self,e) {
            var attrs = self.attrs,
                point = self.pt;

            //update curve
            point.x = attrs.x;
            point.y = attrs.y;

            if(attrs.num == 1){//control point   
                return;
            }
            
            //check attach
            var prim,i,
                pos = stage.mousePos,
                attach = attrs.attach,
                attachPrim = data.attachPrim;
            if(attach.attached){
                prim = attachPrim[attach.primIndex];
                if(!prim.intersects(pos)){
                    delete prim.attachNode[attach.attachId];
                    attrs.fill = attrs.detachFill;
                    attach.attached = false;
                }
            }else{
                for(i in attachPrim){
                    prim = attachPrim[i];
                    if(prim.intersects(pos)){
                        prim.attachNode[attach.attachId] = self;
                        attach.primIndex = i;
                        attrs.fill = attrs.attachFill;
                        attach.attached = true;
                        break;
                    }
                }
            } 
        }
        
        function dragend(self, e) {
            var prim,
                attrs = self.attrs,
                num = attrs.num,
                curve = self.curve,
                text = curve.text,
                anchors = curve.anchors;
              
            if(num != 1){
                var attach = attrs.attach,
                    attachPrim = data.attachPrim;
                if(!attach.attached){
                    prim = attachPrim[attach.primIndex];
                    if(prim){
                        if(num == 2){
                            curve.dst = null;
                        }else if(num == 0){
                            curve.src = null;
                        }
                        delete prim.attachNode[attach.attachId];
                    }
                }else{
                    prim = attachPrim[attach.primIndex];
                    if(prim){
                        prim.nearPoint && prim.nearPoint(self);
                    }else{
                        //util.log('bug');
                        attach.attached = false;
                    }
                }
            }
            //update text
            text.relocation(anchors);
            if(text.attrs.text != ""){
                text.show();
            }
            self.getStage().config.onDragEnd({src: curve, e: e});
            self.getLayer().draw();
            curve.saveDot();
        }
            
        curve.anchors = [];
        for(var i=0,l=anchorPos.length; i<l; i++){
            curve.anchors[i] = new Kinetic.Circle({
                x: anchorPos[i].x,
                y: anchorPos[i].y,
                radius: option.anchorRadius,
                stroke: option.anchorStroke,
                fill: option.anchorDetachFill,
                detachFill: option.anchorDetachFill,
                attachFill: option.anchorAttachFill,
                strokeWidth: option.anchorStrokeWidth,
                num: i,
                attach:{
                    attached: false,
                    attachId: data.count++,
                    primIndex: -1,
                    apId: -1
                },
                draggable: option.draggable
            }); 
            curve.anchors[i].curve = curve;
            curve.anchors[i].deleteFunc = curveDelete;

            curve.anchors[i].on("mouseover", function(e) {
                document.body.style.cursor = "pointer";
                this.setRadius(this.getRadius().x + 1);
                this.getLayer().draw();
                this.getStage().config.onMouseover({src: this.curve, e: e});
            });
            
            curve.anchors[i].on("mouseout", function(e) {
                document.body.style.cursor = "default";
                this.setRadius(this.getRadius().x - 1);
                var x = this.getRadius().x;
                if(x > 3){
                    alert('may be a bug occur');
                }
                this.getLayer().draw();
                this.getStage().config.onMouseout({src: this.curve, e: e});
            });
            
            curve.anchors[i].on("dragstart", function() {
                this.curve.text.hide();
            });
            
            curve.anchors[i].on("dragmove", function(e){
                dragmove(this,e);
            });
            
            curve.anchors[i].on("dragend", function(e){
                dragend(this, e);
            });
            curve.anchors[i].pt = anchorPos[i];//cache
        } 
        curve.anchors[2].dragmove = dragmove;
        curve.anchors[2].dragend = dragend;
        curve.arrow.anchorAttr = curve.anchors[2].attrs;//cache
        

        if(typeof config.points != 'undefined'){
            curve.anchors[1].hide();
        }
        
        
        line = data.line;
        if(!line.flag){
            line.anchors = curve.anchors;
        }

        curve.on('mousedown', function(e){
            util.blurFocus(this); 
            this.top();
            this.getLayer().draw();
        });

        curve.on('dblclick', function(e){
            this.getStage().config.onDbClick({src: this, e: e});
        });

        curve.on('mouseover', function(e){
            document.body.style.cursor = "pointer";
            this.getStage().config.onMouseover({src: this, e: e});
        });
        
        curve.on('mouseout', function(e){
            document.body.style.cursor = "default";
            this.getStage().config.onMouseout({src: this, e: e});
        });
        
        curve.on('dragstart', function(e){
            var i;
            this.dash.hide();
            this.text.hide();
            this.arrow.hide();
            for(i=0; i<3; i++){
                this.anchors[i].hide();
            }
        });
        
        curve.on('dragend', function(e){
            var i, l,
                attrs = this.attrs,
                points = attrs.points,
                anchors = this.anchors,
                arrow = this.arrow,
                text = this.text;
            
            for(i=0,l=points.length; i<l; i++){
                //update curve
                points[i].x += attrs.x;
                points[i].y += attrs.y;
                
                //update anchor
                anchors[i].attrs.x = points[i].x;
                anchors[i].attrs.y = points[i].y;
                anchors[i].show();
            }
            
            attrs.x = attrs.y = 0;
            
            this.dash.show();
            arrow.show();
            text.relocation(anchors);
            if(text.attrs.text != ""){
                text.show();
            }
            
            //check anchor is out of attachNode?
            for(var i=0; i<3; i=i+2){
                var attach = anchors[i].attrs.attach;
                if(attach.attached){
                    var prim = data.attachPrim[attach.primIndex];
                     
                    if(!prim.intersects({x: anchors[i].attrs.x, y:anchors[i].attrs.y})){
                        delete prim.attachNode[attach.attachId];
                        attach.attached = false;
                        anchors[i].attrs.fill = anchors[i].attrs.detachFill;
                        if(i == 2){
                            anchors[i].curve.dst = null;
                        }else{
                            anchors[i].curve.src = null;
                        }
                        
                    }
                }
            }
            
            this.getStage().config.onDragEnd({src: this, e: e});
            
            layer.draw();
            this.saveDot();
        });
        
        layer.add(curve);
        layer.add(curve.text);
        layer.add(curve.dash);
        layer.add(curve.arrow);
        layer.add(curve.anchors[0]);
        layer.add(curve.anchors[1]);
        layer.add(curve.anchors[2]);
        
        curve.setStyle = setStyle;
        curve.top = moveToTop;
        curve.deleteFunc = deleteFunc;
        curve.editFunc = editFunc;
        curve.getEndsPrims = getEndsPrims;
        curve.attr = attr;
        curve.type = gVar.type.QUAD_CURVE;
        
        curve.text.relocation(curve.anchors);
        
        if(typeof config.points == 'undefined'){
            util.blurFocus(curve);
        }else{
            curve.blurFunc();////////////////////////////////////////
        }
        
        curve.saveDot();
        
        stage.config.onDraw({src: curve, e: {x: option.x, y: option.y}});

        return curve;
    } 

    util.drawCurve = drawCurve;
})();