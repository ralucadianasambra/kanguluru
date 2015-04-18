
function Color(id, name, R, G, B){
	this.id = id;
	this.name = name;
	this.R = R;
	this.G = G;
	this.B = B;
}

function Constraint(id, level, name)
{
	this.name = name;
	this.id = id;
	this.inUse = false;
	this.level = level;
}

function Place(id, xOff, yOff, boardWidth, boardHeight, x, y, nextTo, inFrontOf, cornerWith, longSide, bigCorner){
	this.id = id;
	this.x = xOff + boardWidth*x;
	this.y = yOff + boardHeight*y;
    this.xp = x;
    this.yp = y;
	this.free = true;
	this.nextTo = nextTo;
	this.inFrontOf = inFrontOf;
	this.cornerWith = cornerWith;
	this.longSide = longSide;
	this.shortSide = !longSide;
	this.bigCorner = bigCorner;
	this.smallCorner = !bigCorner;
}


function Player(id){
    this.score = 0;
    this.newPoints = 0;
    this.name = "";
    this.id = id;
	this.pieces = [];
    this.round = 0;
}


function Card(constraintId, colorId){
	this.constraintId = constraintId;
	this.colorId = colorId;
}

function Piece(id, colorId, radius, x, y){
    this.id = id;
    this.colorId = colorId;
    this.radius = radius;
    this.x = x;
    this.y = y;
	this.placeId = -1;
	this.ok = false;
	this.card;
}



Piece.prototype.draw = function(ctx, Colors) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
	var grd=ctx.createRadialGradient(this.x, this.y, this.radius*0.5, this.x, this.y, this.radius);
    var c = Colors[this.colorId];
	grd.addColorStop(0, "rgba("+c.R+", "+c.G+", "+c.B+", 0.95)");
	grd.addColorStop(0.8, "rgba(255, 255, 255, 0.9)");
    grd.addColorStop(1, "rgba(255, 255, 255, 0.1)");
    ctx.fillStyle = grd;
    ctx.fill();
}


// Determine if a point is inside the shape's bounds
Piece.prototype.contains = function(mx, my) {
    dx = mx - this.x;
    dy = my - this.y;
    dist = Math.sqrt(dx*dx + dy*dy);
    if(dist <= this.radius)
        return true;
    else
        return false;
}
    
Piece.prototype.fitInPlace = function(places){
	var minDist = this.radius*10;
	var idClosestPlace = -1;
	for(var cpl = 0; cpl < places.length; cpl++){
		if(places[cpl].free){
			dx = places[cpl].x - this.x;
			dy = places[cpl].y - this.y;
			dist = Math.sqrt(dx*dx + dy*dy);
			if(dist < 1.8*this.radius && dist < minDist){
				minDist = dist;
				idClosestPlace = cpl;
			}
		}
	}
	if(idClosestPlace == -1)		//nothing found
		return false;
	else{
		this.x = places[idClosestPlace].x;
		this.y = places[idClosestPlace].y;
		places[idClosestPlace].free = false;
		this.placeId = idClosestPlace;
		return true;
	}
}

    
    
    


