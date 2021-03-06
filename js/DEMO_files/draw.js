 

// Drawing Functionality
var draw = {
	init: function(){
		draw.loadMapData(function(){
			draw.redraw();
			draw.showPlayer();
		});
		//draw.autoRedraw();
	},
	
	autoRedraw: function(){
		draw['redrawProcess'] = setInterval(function(){
			draw.drawSprites();
		}, 200);
	},
	
	pauseRedraw: function(){
		clearInterval(draw.redrawProcess);
	},
	
	tiles: {
		height: 64,
		width: 128,
		source: {
			10:'images/tileset_10.png',
			17:'images/tileset_09.png',
			22:'images/tileset_22.png',
			23:'images/tileset_23.png',
			24:'images/tileset_24.png',
			25:'images/tileset_25.png',
			'wall1':'images/tileset_21.png',
			'pit':'images/tileset_07.png',
			'teleport':'images/tileset_02.png',
			
			//Character tiles
			'cow':{
				'up':'images/tileset_cow_03_left.png',
				'right':'images/tileset_cow_03.png',
				'down':'images/tileset_cow_03.png',
				'left':'images/tileset_cow_03_left.png'
			}
		},
	},
	mapLayer: {},
	objectLayer: {},
	mobLayer: {},
	mapID: 0,
	activeLayers:[
		'mapLayer',
	],
	layerContexts: {},
	
	spriteCache: {},
	limitToViewport: false,
	
	viewportXY: [0,0],
	
	redraw: function(){
		draw.drawLayers();
	},
	
	mapRows: function(map){
		var size = 0, key;
		for (key in map) {
			if (typeof map[key] == 'object'){
				if (map.hasOwnProperty(key)) size++;
			}
		}
		return size;
	},
	
	canvasSize: function(){
		if (typeof draw.canvasSizeCache == 'undefined' ) {
			// Gather the canvas size.
			draw.canvasSizeCache = [$('#gameScreen').width(), $('#gameScreen').height()];
		}
		return draw.canvasSizeCache;
	},
	
	mapSize: function(){
		if ( typeof draw['mapSizeCache'] == 'undefined'){
			var baseLayer = 'mapLayer';
			var blockY = draw.mapRows(draw[baseLayer]);
			var blockX = draw[baseLayer][0].length;
			
			var right = draw.blockToPixel([blockX, blockY])[0] + draw.tiles.width;
			var down = draw.blockToPixel([0, blockY])[1] + draw.blockToPixel([0, blockY])[1] + draw.tiles.height;
			draw['mapSizeCache'] = [right, down];
			console.log([blockX, blockY]);
			console.log(draw.mapSizeCache);
		}
		return draw.mapSizeCache;
	},
	
	centerOfCanvas: function(){
		return [draw.canvasSize()[0]/2, draw.canvasSize()[1]/2];
	},
	
	showPlayer: function(){
		var spriteImages = sprite.characters[0][1];
		var spriteID = sprite.characters[0][3];
		var spriteName = sprite.characters[0][0];
		var exactPosition = [draw.centerOfCanvas()[0] - (draw.tiles.width/2),draw.centerOfCanvas()[1] - (draw.tiles.height/2)];
		$('#overlay').append('<div id="' + spriteID + '" style="width:128px; height:64px; position:absolute; top:'+ exactPosition[1] +'px; left:'+ exactPosition[0] +'px; background-image:url('+ spriteImages['right'] +'); background-repeat:no-repeat;" title="' + spriteName + '"></div>');
	},
	
	drawLayers: function(){
		for( var layer in draw.activeLayers ){
			draw.drawLayer(draw.activeLayers[layer]);
		}
	},
	
	getCacheCanvas: function(layer){
		if ($('#cache-'+layer).length == 0){
			var layerhtml = '<canvas id="cache-'+layer+'" width="'+ draw.mapSize()[0] +'px" height="'+ draw.mapSize()[1] +'px"></canvas>';
			$('#cache').prepend(layerhtml);
		}
		return document.getElementById('cache-'+layer).getContext('2d');
	},
	
    drawLayer: function(layer){
		/* Drawlayer draws the passed layer name.
		 * Layer is the element ID of the canvas element, 
		 * and it's the name of the location of which to find the layer in the draw object.
		 */
		//Show the loading screen.
		ui.showLoading();
		
		console.log('refresh map');
		
		// Get the cache canvas
		var ctx = draw.getCacheCanvas(layer);
		
		// Clear the board
		ctx.clearRect(0, 0, draw.mapSize()[0], draw.mapSize()[1]);
		
		// Set the cursor draw position.
		var cursorX = 0;
		var cursorY = draw.mapSize()[1]/2;
		
		for(var row in draw[layer]){
			if ( row == 'zindex') {
				continue;
			}
			// Step the vertical position down 32 pixels to account for the new row.
			cursorY = cursorY;
			// Step the horizontal position across 64 pixel to account for the new row.
			//cursorX = cursorX + (draw.tiles.width/2);
			
			// block counter, get the number of blocks in this row starting from the last one.
			var block = draw[layer][row].length;
			
			// Move the cursor all the way to the end of the row. 
			cursorX += block * (draw.tiles.width/2);
			cursorY += block * ((draw.tiles.height/2) * -1);
			
			// Iterate through the available blocks
			while(block >= 0){
				
				// If the block isn't empty, then we'll print it.
				if (draw[layer][row][block] != 0){
					
					// Load the tile image location into draw memory.
					var tile = new Image();
					tile.src = draw.tiles.source[draw[layer][row][block-1]];
					
					// Limit draw distance to viewport?
					if ( draw.limitToViewport ) {
						// If the block is within the confines of our view, then draw it. 
						if( ( draw.mapSize()[0] > cursorX ) && ((draw.tiles.width * -1) < cursorX) && ( draw.mapSize()[1] > cursorY) && ((draw.tiles.height * -1) < cursorY)){
							ctx.drawImage(tile, cursorX, cursorY);
						}
					} else {
						ctx.drawImage(tile,cursorX, cursorY);
					}
					
				}
				
				// Move the cursor one step.
				cursorX -= (draw.tiles.width/2);
				cursorY -= ((draw.tiles.height/2) * -1);
				
				// Count down the drawn block.
				block -= 1;
			}
			// Moves the cursor to the start of the next row.
			cursorX = cursorX + (draw.tiles.width);
			//cursorY = cursorY - (draw.tiles.height);
			
		}
		draw.updateDisplayCanvas(layer);
		ui.hideLoading();
    },
	
	getDisplayCanvas: function(layer){
		//see if the layer exists
		if( $('#' + layer).length == 0 ){
			//if the layer dosen't exist, create it.
			var zindex = 'z-index:' + draw[layer].zindex + ';';
			var width = 'width:' + draw.canvasSize()[0] + 'px;';
			var height = 'height:' + draw.canvasSize()[1] + 'px;';
			var style = 'style="' + zindex + width + height + '"';
			var layerhtml = '<canvas id="' + layer + '"' + style +' width="'+ draw.canvasSize()[0] +'px" height="'+ draw.canvasSize()[1] +'px">'+ ui.updateBrowserMessage +'</canvas>';
			
			// Currently each layer must be added lowest first. We add the layer after the #obj element.
			$('#gameScreen').prepend(layerhtml);
		}
		return document.getElementById(layer).getContext('2d');
	},
	
	updateDisplayCanvas: function(layer, ctx){
		
		if (typeof ctx == "undefined"){
			// Get the display canvas
			var ctx = draw.getDisplayCanvas(layer);
		}
		// Get the cache, canvas.
		var cache = document.getElementById('cache-'+layer);
		
		// Root
		var rootX = draw.viewportXY[0] + (draw.canvasSize()[0]/2);
		var rootY = draw.viewportXY[1] + (draw.canvasSize()[1]/2);
		
		
		// Write the cache to the display
		ctx.clearRect(0, 0, draw.canvasSize()[0], draw.canvasSize()[1]);
		ctx.drawImage(cache, rootX, rootY);
	},
	
	normalize: function(XY, scale){
		var normal = Math.sqrt(XY[0] * XY[0] + XY[1] * XY[1]);
		if ( normal != 0 ) {
			var x = scale * XY[0] / normal;
			var y = scale * XY[1] / normal;
		}
		return [x, y];
	},
	
	movePlayer: function(XY){
		
		var mouseX = draw.centerOfCanvas()[0];
		var mouseY = draw.centerOfCanvas()[1];
		
		var centerX = XY[0];
		var centerY = XY[1];
		
		var deltaX = mouseX - centerX;
		var deltaY = mouseY - centerY;
		
		var normalized = draw.normalize([deltaX, deltaY], player.speed);
		
		for( var layer in draw.activeLayers ){
			draw.moveDisplayCanvas(draw.activeLayers[layer], normalized);
		}
	},
	
	moveDisplayCanvas: function(layer, XY){
		// Get the canvas
		var ctx = draw.getDisplayCanvas(layer);
		draw.moveCanvas(ctx, XY);
		draw.updateDisplayCanvas(layer, ctx);
	},
	
	moveCanvas: function(ctx, XY){
		ctx.translate(XY[0],XY[1]);
	},

    drawSprites: function() {
		/*
		 * Draws and Updates all the sprites on the map.
		 * Should be refactored into an HTML5 layer.
		 */
		
		// Define X and Y
		var x = 0;
		var y = 1;
		
		ui.showLoading();
		for ( var toon in sprite.characters ){
			// Shorten the variable to make the next steps easy.
			var spriteStatus = sprite.characters[toon];
			var spriteLocation = spriteStatus[2];
			var spriteID = spriteStatus[3];
			var spriteImages = spriteStatus[1];
			var spriteName = spriteStatus[0];
			
			// Get the location to draw
			var exactPosition = draw.cursorOffsetBlockToPixel(spriteLocation);
			
			// Check if the sprite exists.
			if ($('#' + spriteID ).length > 0) {
				// Don't animate if you don't have to.
				if ((draw.spriteCache[spriteID][x] != exactPosition[x]) || (draw.spriteCache[spriteID][y] != exactPosition[y])){
					// Update the cache.
					draw.spriteCache[spriteID] = exactPosition;
					console.log(draw.spriteCache);
					console.log(exactPosition);
					console.log('animating '+ spriteID);
					// Animate to the new position
					$('#' + spriteID ).animate({
						top: exactPosition[y],
						left: exactPosition[x]
					},200);
					draw.moveViewport();
				}
			} else {
				// Write to the sprite container
				draw.spriteCache[spriteID] = exactPosition;
				$('#overlay').append('<div id="' + spriteID + '" style="width:128px; height:64px; position:absolute; top:'+ exactPosition[y] +'px; left:'+ exactPosition[x] +'px; background-image:url('+ spriteImages['right'] +'); background-repeat:no-repeat;" title="' + spriteName + '"></div>');
			}
		}
		ui.hideLoading();

    },
	
	cursorOffsetBlockToPixel: function(XY){
		// Define X and Y
		var x = 0;
		var y = 1;
		
		// Define cursor location. 
		var cursorX = draw.viewportXY[0];
		var cursorY = draw.viewportXY[1] - (draw.tiles.height/2);
		
		// Convert block position to pixels
		var pixelXY = draw.blockToPixel(XY);
		
		var exactXY = [];
		// Calculate the X & Y positions.
		exactXY[x] = cursorX + pixelXY[0];
		exactXY[y] = cursorY + pixelXY[1];
		
		return exactXY;
	},
	
	blockPixelLocation: function(XY){
		var location = draw.blockToPixel(XY);
		// Add the map root to the location
		
		var mapX = 0 + draw.tiles.width;
		var mapY = (draw.mapSize()[1]/2);
		return [
			location[0] + mapX,
			location[1] + mapY
		];
	},
	
	blockToPixel: function(XY){
		// Define X and Y
		var x = 0;
		var y = 1;
		
		// block width and height is half the size of the tile.
		var blockWidth = draw.tiles.width/2;
		var blockHeight = draw.tiles.height/2;
		
		// Multiply the block position by the pixel size of the block offsets,
		// offset by the maproot
		return [
			((XY[x] * blockWidth) + (XY[y] * blockWidth)),
			((XY[y] * blockHeight) + (XY[x] * (-blockHeight)))
		];
	},
	
	moveViewport: function(XY){
		/* Move Viewport
		 * When the XY is passed, move the viewport to the new location.
		 */
		
		draw.viewportXY[0] += XY[0];
		draw.viewportXY[1] += XY[1];
		
	},
	
	setViewportCenter: function(){
		// This is some wild math that will take the position of the player, then figure out where the screen should be looking.
		console.log(sprite.characters[0][2]);
		var positionXY = draw.blockPixelLocation( sprite.characters[0][2] );
		
		// Then it takes the size of the screen, and takes the screen width and height into account.
		//positionXY[0] += (draw.canvasSize()[0] / 2);
		//positionXY[1] += (draw.canvasSize()[1] / 2);
		
		positionXY[0] = positionXY[0] * -1;
		positionXY[1] = positionXY[1] * -1;
		
		// Set position
		draw.viewportXY = positionXY;
	},
	
	loadMapData: function(callback){
		service.getMapData(function(data){
			// Core map layer
			draw.mapLayer = data.map.map;
			
			// Object Layer
			draw.objectLayer = data.overlay;
			
			// Tile source data
			//draw.tiles.source = data.tileSrc;
			
			// Player Data
			sprite.characters = data.chars;
			
			// Map Identifier
			draw.mapID = data.mapid;
			
			// Set the center of the viewport
			draw.setViewportCenter();
			
			// Run callback
			if( callback ){
				callback(data);
			}
		});
	},
};