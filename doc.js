function LPS(id, config)
	config = {
        onDbClick: function({src, e}){},
        onMouseover: function({src, e}){},
        onMouseout: function({src, e}){},
        onDraw: function({src, e}){},
        onRightClick: function({src, e}){},
        onDragEnd: function({src, e}){}
    };
    LPS.destroy //unimplement
    LPS.loadJson: function( json )
    LPS.getJson: function() //json
    LPS.clear: function() 
    LPS.getSelectedPrim() //prim
    LPS.getAllByType(type.CIRCLE || type.STRIPE || type.RECT || type.NONE) //prims
        type = { NONE: 0, BG: 1, QUAD_CURVE: 2, CIRCLE: 3, STRIPE: 4, RECT: 5};
        
    LPS.toDrawCurve(config)
        config = {
            type: 'solid', //'dot'
            curveStroke: 'black',
            draggable: true,
            
            dashArray: [1, 10, 0, 1],
            dashStroke: 'black',
            dashStrokeWidth: 1,
            
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
        
    LPS.toDrawCircle(config)
        config = {
            radius: 20,
            fill: 'black',
            blurStroke: 'black',
            focusStroke: 'blue',
            strokeWidth: 1,
            draggable: true
        }
        
    LPS.toDrawStripe(config)
        config = {
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
        
    LPS.toDrawRect(config)
        config = {
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
        }
        
        
Prim:
    curve
        curve.type = tyep.QUAD_CURVE
        curve.setStyle(config);
            config = {
                curve: {
                    type: 'solid', //'dot'
                    stroke: 'black',
                    strokeWidth: 1
                },
                dash: {
                    dashArray: [1, 10, 0, 1],
                    stroke: 'black',
                    strokeWidth: 1
                },
                text: {
                    align: 'left',
                    padding: 0,
                    fontSize: 12,
                    fontFamily: "Calibri",
                    fill: 'white',
                    textFill: 'green'
                },
                arrow: {
                    sizeX: 12,
                    sizeY: 10,
                    fill: 'black',
                    stroke: 'black',
                    strokeWidth: 1
                },
                anchor: {
                    stroke: 'green',
                    fill: 'yellow',
                    strokeWidth: 1
                }
            }
            
        curve.editFunc(config)
            config = {
                text: ''
            }
        curve.deleteFunc()
            
        curve.attr(key, value);
        curve.getEndsPrims(); //prims
    
    circle
        circle.type = type.CIRCLE;
        circle.setStyle(config);
            config = {
                circle: {
                    fill: 'black',
                    stroke: 'black',
                    strokeWidth: 1
                }
            }
        circle.deleteFunc()
            
        circle.attr(key, value);
        circle.getInLines();//lines
        circle.getOutLines();//lines
        circle.getAssociatedLines();//lines
        circle.getInPrims();//prims
        circle.getOutPrims();//prims
        circle.getAssociatedPrims();//prims
        
    stripe
        stripe.type = type.STRIPE
        stripe.setStyle(config);
            config = {
                stripe: {
                    fill: 'black',
                    stroke: 'black',
                    strokeWidth: 1
                },
                topAnchor: {
                    stroke: 'green',
                    fill: 'yellow',
                    strokeWidth: 1
                },
                bottomAnchor: {
                    stroke: 'green',
                    fill: 'yellow',
                    strokeWidth: 1
                }
            }
        stripe.deleteFunc()
            
        stripe.attr(key, value);
        stripe.getInLines();//lines
        stripe.getOutLines();//lines
        stripe.getAssociatedLines();//lines
        stripe.getInPrims();//prims
        stripe.getOutPrims();//prims
        stripe.getAssociatedPrims();//prims
        
        
    rect
        rect.type = type.RECT
        rect.setStyle(config);
            config = {
                rect: {
                    align: 'center',
                    fontSize: 14,
                    fontFamily: "Calibri",
                    fill: 'white',
                    padding : 10,
                    stroke: 'black'
                    strokeWidth: 1,
                    textFill: 'green'
                },
                ltText: {
                    align: 'left',
                    fontSize: 12,
                    fontFamily: "Calibri",
                    fill: 'white',
                    padding : 0,
                    stroke: 'white',
                    textFill: 'green',
                    strokeWidth: 1
                },
                rtText: {
                    align: 'right',
                    fontSize: 12,
                    fontFamily: "Calibri",
                    fill: 'white',
                    padding : 0,
                    stroke: 'white',
                    textFill: 'green',
                    strokeWidth: 1
                }
            }
        rect.editFunc(config);
            config = {
                text: {
                    text: ''
                },
                ltText: {
                    text: ''
                },
                rtText: {
                    text: ''
                }
            }
        rect.deleteFunc()
            
        rect.attr(key, value);
        rect.getInLines();//lines
        rect.getOutLines();//lines
        rect.getAssociatedLines();//lines
        rect.getInPrims();//prims
        rect.getOutPrims();//prims
        rect.getAssociatedPrims();//prims