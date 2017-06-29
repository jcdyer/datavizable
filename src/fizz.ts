
function bind(scope, fn) {
	return function () {
		return fn.apply( scope, arguments );
	}
}

function localCoords(event, element, root) {
	var p = root.createSVGPoint();
	p.x = event.clientX;
	p.y = event.clientY;
	p = p.matrixTransform(element.getScreenCTM().inverse());

	// NOTE: now we're looking at the numbers, so limiting the floats to precison 2 makes it easier
	// since SVG only works at one pixel of accuracy anyway
	// p.x = Math.round(p.x * 100)/100;
	// p.y = Math.round(p.y * 100)/100;
	// console.log("p: " + p.x + "," + p.y);

	return p;
}   
function simpledrawObj(svgrooot) {
  this.root = svgrooot;
  this.backdrop = this.root.getElementById("backdrop");
  this.canvas = this.root.getElementById("canvas");
  this.scaffolds = this.root.getElementById("scaffolds");

  // NOTE: now distinguish between active shape and 
  //       other drawn elements, like the scaffold
  this.activeShape = null;
  this.activeScaffold = null;
  this.activeHandle = null;
  this.points = null;

  this.buttons = null;
  this.mode = "draw-dot";

  this.coords = this.root.createSVGPoint();
  this.originpoint = this.root.createSVGPoint();

  // styles
  this.styles = {
    "fill": "black",
    "stroke": "black",
    "stroke-width": "1px"
  };

  this.values = {
    "symbol": "hexagon"
  };

  // constants
  this.svgns = "http://www.w3.org/2000/svg";
  this.xlinkns = "http://www.w3.org/1999/xlink";
}

simpledrawObj.prototype.init = function () {
  this.root.addEventListener('click', bind(this, this.draw), false );

  this.root.addEventListener('mousedown', bind(this, this.grab), false );
  this.root.addEventListener('mousemove', bind(this, this.drag), false );
  this.root.addEventListener('mouseup', bind(this, this.drop), false );

  this.buttons = document.querySelectorAll("button");
  for (var b = 0, bLen = this.buttons.length; bLen > b; ++b) {
    var eachButton = this.buttons[b];
    eachButton.addEventListener('click', bind(this, this.handleButtons), false );
  }

  this.listboxes = document.querySelectorAll("[role='listbox']");
  for (var l = 0, lLen = this.listboxes.length; lLen > l; ++l) {
    var eachListbox = this.listboxes[l];
    eachListbox.addEventListener('click', bind(this, this.handleDropdown), false );
  }

  this.inputs = document.querySelectorAll("input[type='number']");
  for (var i = 0, iLen = this.inputs.length; iLen > i; ++i) {
    var eachInput = this.inputs[i];
    eachInput.addEventListener('click', bind(this, this.handleInputs), false );
  }

  // console.log( JSON.stringify(this.styles).replace(/"/g, "").replace(/,/g, "; ").replace(/[{}]/g, "") )
}


/*
// draw
*/
simpledrawObj.prototype.draw = function (event){
  if ( this.backdrop == event.target 
    || this.canvas == event.target.parentNode 
    || this.scaffolds == event.target.parentNode ) {
    // adjust coords
    this.coords = localCoords(event, this.backdrop, this.root);
    //console.log(event.detail)

    if (2 == event.detail){
      this.reset();
    } else {
      switch (this.mode) {
	case "draw-dot":
	  this.drawDot();
	  break;

	case "draw-polyline":
	  this.drawPoly("polyline" );
	  break;

	case "draw-polygon":
	  this.drawPoly("polygon");
	  break;

	case "draw-rect":
	  this.drawRect();
	  break;

	case "draw-circle":
	  this.drawCircle();
	  break;

	case "draw-path":
	  this.drawPath();
	  break;

	case "draw-freehand":
	  this.drawFreehand();
	  break;

	case "draw-use":
	  this.drawUse();            
	  break;

      }
    }
  }
}

simpledrawObj.prototype.drawDot = function (){
  this.activeShape = document.createElementNS(this.svgns, "circle");
  this.activeShape.setAttribute("cx", this.coords.x);
  this.activeShape.setAttribute("cy", this.coords.y);
  this.activeShape.setAttribute("r", "2");
  this.activeShape.setAttribute("style", this.getStyle() );

  // note that we're now appending draw elements to a specific canvas
  this.canvas.appendChild( this.activeShape );

  // if we don't set this to null, it starts dragging immediately!
  this.activeShape = null;
}

simpledrawObj.prototype.drawPoly = function (shape){
  if (!this.activeShape 
      || shape != this.activeShape.localName ) {
    this.activeShape = document.createElementNS(this.svgns, shape);
    this.activeShape.setAttribute("style", this.getStyle() );
  } else {
    var points = this.activeShape.getAttribute("points");
    this.points = points.split(" ");
  }

  if (!this.points) {
    this.points = [];
  }

  this.points.push( this.coords.x + "," + this.coords.y );
  this.activeShape.setAttribute("points", this.points.join(" "));

  // no longer need to worry about SVG controls
  this.canvas.appendChild( this.activeShape );
}

simpledrawObj.prototype.drawRect = function (){
  if (!this.activeShape ) {
    this.activeShape = document.createElementNS(this.svgns, "rect");
    this.activeShape.setAttribute("style", this.getStyle() );

    if (!this.points) {
      this.points = [];
    }

    // we're using the points array, but in a different way for rect than for polys  
    this.points.push( this.coords.x );
    this.points.push( this.coords.y );

    this.activeShape.setAttribute("x", this.points[0] );
    this.activeShape.setAttribute("y", this.points[1] );

    this.canvas.appendChild( this.activeShape );
  }      
}

simpledrawObj.prototype.drawCircle = function (){
  if (!this.activeShape ) {
    this.activeShape = document.createElementNS(this.svgns, "circle");
    this.activeShape.setAttribute("style", this.getStyle() );

    if (!this.points) {
      this.points = [];
    }

    // we're using the points array, but in a different way for rect than for polys  
    this.points.push( this.coords.x );
    this.points.push( this.coords.y );

    this.activeShape.setAttribute("cx", this.points[0] );
    this.activeShape.setAttribute("cy", this.points[1] );

    this.canvas.appendChild( this.activeShape );
  }      
}

simpledrawObj.prototype.drawPath = function (){
  if (!this.activeShape ) {
    this.activeShape = document.createElementNS(this.svgns, "path");
    this.activeShape.setAttribute("style", this.getStyle() );
  }

  // var d = this.activeShape.getAttribute("d");
  // if (!d) {
  //   d = "M";
  // }
  // d += " " + this.coords.x + "," + this.coords.y + " ";

  // NOTE: we're now storing the points array for a path  
  if (!this.points) {
    this.points = [];
  }
  this.points.push( this.coords.x + "," + this.coords.y );

  var d = "M";
  var pointCount = this.points.length;
  if ( 3 == pointCount ) {
    d += this.points[0] + " Q" + this.points[1] + " " + this.points[2];
  } else if ( 4 == pointCount ) {
    d += this.points[0] + " C" + this.points[1] + " " + this.points[2] + " " + this.points[3];
  } else {
    d += this.points.join(" ");
  }
  this.activeShape.setAttribute("d", d);

  this.canvas.appendChild( this.activeShape );

  this.drawScaffold();
}

simpledrawObj.prototype.drawFreehand = function (){
  if (!this.activeShape ) {
    this.activeShape = document.createElementNS(this.svgns, "path");
    this.activeShape.setAttribute("style", this.getStyle() );
  }

  var d = this.activeShape.getAttribute("d");
  if (!d) {
    d = "M";
  }
  d += " " + this.coords.x + "," + this.coords.y + " ";
  this.activeShape.setAttribute("d", d);

  this.canvas.appendChild( this.activeShape );
}

simpledrawObj.prototype.drawUse = function (){
  this.activeShape = document.createElementNS(this.svgns, "use");
  this.activeShape.setAttribute("x", this.coords.x);
  this.activeShape.setAttribute("y", this.coords.y);
  this.activeShape.setAttributeNS(this.xlinkns, "href", "#" + this.values["symbol"]);
  this.activeShape.setAttribute("style", this.getStyle() );

  this.canvas.appendChild( this.activeShape );
  this.activeShape = null;
}


simpledrawObj.prototype.drawScaffold = function (){
  if (!this.activeScaffold ) {
    this.activeScaffold = document.createElementNS(this.svgns, "polyline");
    var scaffoldStyle = "fill:none; ";
    scaffoldStyle += "stroke:blue; ";
    scaffoldStyle += "stroke-width:3px; ";
    scaffoldStyle += "stroke-linecap:round; ";
    scaffoldStyle += "stroke-linejoin:round; ";
    scaffoldStyle += "stroke-dasharray:0.5 10; ";
    scaffoldStyle += "marker:url(#handle); ";
    this.activeScaffold.setAttribute("style", scaffoldStyle );
    this.scaffolds.appendChild( this.activeScaffold );
  }
  this.activeShape.setAttribute("points", this.points.join(" "));

  // create initial handle
  this.activeHandle = document.createElementNS(this.svgns, "circle");
  this.activeHandle.setAttribute("cx", this.coords.x);
  this.activeHandle.setAttribute("cy", this.coords.y);
  this.activeHandle.setAttribute("r", "6");
  var handleStyle = "fill:none; ";
  handleStyle += "stroke:blue; ";
  handleStyle += "stroke-width:2px; ";
  handleStyle += "pointer-events:all; ";
  this.activeHandle.setAttribute("style", handleStyle );

  this.scaffolds.appendChild( this.activeHandle );
}


/*
// drag-n-drop
*/
simpledrawObj.prototype.grab = function (event){
  if ( "drag" == this.mode 
    || "erase" == this.mode 
    || "animate" == this.mode ){
    // stop native drag-n-drop
    event.preventDefault();
    event.stopPropagation();

    // only grab things in drawing area
    if ( this.canvas == event.target.parentNode ) {
      var target = event.target;
      if (this.backdrop != target) {
	this.activeShape = target;

	this.coords = localCoords(event, this.backdrop, this.root);
	this.originpoint = this.coords;

	// adjust for existing transforms
	var transform = this.activeShape.getAttribute("transform");
	if (transform) {
	  var translate = transform.replace("translate(", "").replace(")", "").split(",");
	  this.originpoint.x -= parseFloat( translate[0] );
	  this.originpoint.y -= parseFloat( translate[1] );
	}
      }
    }
  } 
}

simpledrawObj.prototype.drag = function (event) {
  // stop native drag-n-drop
  event.preventDefault();
  event.stopPropagation();

  this.coords = localCoords(event, this.backdrop, this.root);

  if ( "drag" == this.mode ){
    if ( this.activeShape ) {
      var x = this.coords.x - this.originpoint.x;
      var y = this.coords.y - this.originpoint.y;

      this.activeShape.setAttribute("transform", "translate(" + x + "," + y + ")");
    }
  } else if (this.activeShape) {
    switch (this.mode) {
      case "draw-dot":
	break;

      case "draw-rect":
	this.updateRect();
	break;

      case "draw-circle":
	this.updateCircle();
	break;

      case "draw-polyline":
      case "draw-polygon":
	this.updatePoly();            
	break;

      case "draw-path":
	this.updatePath();            
	break;

      case "draw-freehand":
	this.updateFreehand();            
	break;
    }
  }
}

simpledrawObj.prototype.drop = function (){
  if ( "drag" == this.mode ){
    this.activeShape = null;
  } else if ( "erase" == this.mode ) {
    if ( this.activeShape ) {
      this.activeShape.parentNode.removeChild( this.activeShape );
      this.activeShape = null;
    }
  } else if ( "animate" == this.mode ) {
    this.animate();
  }
}

/*
// Update shapes
*/
simpledrawObj.prototype.updatePoly = function (){
  var points = this.points.join(" ");
  points += " " + this.coords.x + "," + this.coords.y;
  this.activeShape.setAttribute("points", points);
}

simpledrawObj.prototype.updatePath = function (){
  var d = "M";
  var pointCount = this.points.length;
  if ( 2 == pointCount ) {
    d += this.points[0] + " Q" + this.points[1];
  } else if ( 3 == pointCount ) {
    d += this.points[0] + " C" + this.points[1] + " " + this.points[2];
  } else {
    d += this.points.join(" ");
  }
  d += " " + this.coords.x + "," + this.coords.y;

  this.activeShape.setAttribute("d", d);

  this.updateScaffold();
}

simpledrawObj.prototype.updateFreehand = function (){
  var d = this.activeShape.getAttribute("d");
  if (!d) {
    d = "M";
  }
  d += this.coords.x + "," + this.coords.y + " ";
  this.activeShape.setAttribute("d", d);
}

simpledrawObj.prototype.updateRect = function (){
  // we're using the points array, but in a different way for rect than for polys  
  this.points[2] = this.coords.x;
  this.points[3] = this.coords.y;

  var x = this.points[0];
  var width = this.points[2] - this.points[0];
  if ( 0 > width ) {
    //if the current cursor x is to the left of the origin, we have to reposition the x attribute
    x = this.points[2];
    width = this.points[0] - this.points[2];
  }

  var y = this.points[1];
  var height = this.points[3] - this.points[1];
  if ( 0 > height ) {
    //if the current cursor y is to the top of the origin, we have to reposition the y attribute
    y = this.points[3];
    height = this.points[1] - this.points[3];
  }

  this.activeShape.setAttribute("x", x );
  this.activeShape.setAttribute("y", y );
  this.activeShape.setAttribute("width", width );
  this.activeShape.setAttribute("height", height );
}

simpledrawObj.prototype.updateCircle = function (){
  this.points[2] = this.coords.x;
  this.points[3] = this.coords.y;

  // geometry magic!
  var radius = Math.sqrt(Math.pow(Math.abs(this.points[2] - this.points[0]), 2) 
	     + Math.pow(Math.abs(this.points[3] - this.points[1]), 2));
  this.activeShape.setAttribute("r", radius );
}

simpledrawObj.prototype.updateScaffold = function (){
  if (this.activeScaffold) {
    var points = this.points.join(" ");
    points += " " + this.coords.x + "," + this.coords.y;
    this.activeScaffold.setAttribute("points", points);
  }
}


simpledrawObj.prototype.animate = function (){
  if ( this.activeShape && "path" == this.activeShape.localName ) {
    this.pathLength = this.activeShape.getTotalLength();
    this.pathOffset = this.pathLength;
    this.activeShape.style.strokeDasharray = this.pathLength;
    this.activeShape.style.strokeDashoffset = this.pathOffset;

    var t = this; 
    this.timer = setInterval( function () {
      if ( 0 < t.pathOffset ) {
	t.pathOffset -= 5;
	t.activeShape.style.strokeDashoffset = t.pathOffset;
      } else {
	clearInterval( t.timer );
      }
    }, 10);
  }
}

/*
// UI controls
*/
simpledrawObj.prototype.handleButtons = function (){
  this.reset();

  for (var b = 0, bLen = this.buttons.length; bLen > b; ++b) {
    var eachButton = this.buttons[b];
    eachButton.setAttribute("aria-pressed", "false" );
  }

  var target = <Element>event.target;
  target.setAttribute("aria-pressed", "true" );
  this.mode = target.getAttribute("data-mode");
  
  console.log("mode: " + this.mode);
}

simpledrawObj.prototype.handleDropdown = function (){
  const target = <Element>event.target;
  const targetParent = <Element>target.parentNode;
  const options = targetParent.querySelectorAll("[role='option']")
  for (var o = 0, oLen = options.length; oLen > o; ++o) {
    var eachOption = options[o];
    eachOption.setAttribute("aria-selected", "false" );
  }
  target.setAttribute("aria-selected", "true" );
  var prop = targetParent.getAttribute("data-property");
  if ( prop ) {
    this.styles[prop] = target.textContent;
  } else {
    var datatype = targetParent.getAttribute("data-type");
    this.values[datatype] = target.textContent;
  }
}

simpledrawObj.prototype.handleInputs = function (){
  // Review: Not sure this is always HTMLINputElement.  
  // Could be HTMLTextAreaElement or other related.
  var target = <HTMLInputElement>event.target;  
  var prop = target.getAttribute("data-property");
  this.styles[prop] = target.value;
}

simpledrawObj.prototype.getStyle = function (){
  var style = JSON.stringify(this.styles)
		  .replace(/"/g, "")
		  .replace(/,/g, "; ")
		  .replace(/[{}]/g, "");

  return style;
}


simpledrawObj.prototype.reset = function (){
  // clicking on any button should start a new active element and new mode
  this.points = null;
  this.activeShape = null;
  this.activeScaffold = null;
  this.activeHandle = null;

  // NOTE: remove all old scaffolds
  while (this.scaffolds.firstChild) {
    this.scaffolds.removeChild(this.scaffolds.firstChild);
  }
}


