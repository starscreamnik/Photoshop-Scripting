// Save the current unit preferences (optional)
var startRulerUnits = app.preferences.rulerUnits
var startTypeUnits = app.preferences.typeUnits
// Set units to PIXELS
app.preferences.rulerUnits = Units.PIXELS
app.preferences.typeUnits = TypeUnits.PIXELS

// Use the top-most document
var doc = app.activeDocument; 

if (exportSelectionToJson())
    alert('Selection successfully exported!');

function exportSelectionToJson(){
    // Turn the selection into a work path and give it ref
    if (isSelected(doc.selection) == false) {
        alert("This selection is empty");
        return false;
    }

    doc.selection.makeWorkPath(0.1); 	// set tolerance (in PIXELS). 0 for sharp corners
    var wPath = doc.pathItems.getByName("Рабочий контур");
    var subPaths = wPath.subPathItems;
    var jsonFile = new File("~/Desktop/coords.json");
    jsonFile.open("w");

    alert("SubPaths:" + subPaths.length)
    var subPathLength = subPaths.length

    var bounds = {minX : 10000, minY : 10000, maxX : 0, maxY : 0};
    var stride = 1; // 2 means every 2nd, 3 means every 3rd, etc. Minimum 1
    var coords = [];
    var addedPath = [];

    var mainPath = subPaths[0].pathPoints;
    var length = mainPath.length
    for (var j=0; j<length; j++) {
        if (j % stride === 0) {
            var currPoint = mainPath[j].anchor;
            coords.push(currPoint[0]);
            coords.push(currPoint[1]);

            if (isIntersected(addedPath, currPoint))
                setColor(currPoint);
            addedPath.push(currPoint);
            
            bounds = updateCenterXY(bounds, currPoint[0], currPoint[1]);
        }
    }
    
    var json = '{"coords" : [' + coords.join(",")+'], ' +
                '"sourceX" : '+(bounds.minX+bounds.maxX)*0.5 + ',' +
                '"sourceY" : '+(bounds.minY+bounds.maxY)*0.5;

    if (subPathLength > 1){
        json += ', "masks" :  ['
        for (var i=1; i<subPathLength; i++){

            bounds = {minX : 10000, minY : 10000, maxX : 0, maxY : 0};
            stride = 1; 
            coords = [];
            addedPath = [];

            var maskPath = subPaths[i].pathPoints
            var length = maskPath.length
            for (var j=0; j<length; j++) {
                if (j % stride === 0) {
                    var currPoint = maskPath[j].anchor;
                    coords.push(currPoint[0]);
                    coords.push(currPoint[1]);

                    if (isIntersected(addedPath, currPoint))
                        setColor(currPoint);
                    addedPath.push(currPoint);

                    bounds = updateCenterXY(bounds, currPoint[0], currPoint[1]);
                }
            }
            json += '{"coords" : [' + coords.join(",")+'], ' +
                    '"sourceX" : '+(bounds.minX+bounds.maxX)*0.5 + ',' +
                    '"sourceY" : '+(bounds.minY+bounds.maxY)*0.5 + '}';
            if (i < subPaths.length - 1)
                json += ',';
        }
        json += ']';
    }
    json += "}";

    jsonFile.write(json);
    jsonFile.close();

    wPath.remove();
    return true;
}


function updateCenterXY(bounds, newX, newY){
	if (bounds.minX > newX) bounds.minX = newX;
	if (bounds.minY > newY) bounds.minY = newY;
	if (bounds.maxX < newX) bounds.maxX = newX;
	if (bounds.maxY < newY) bounds.maxY = newY;
	return bounds;
}

function isSelected(selection){
    try      { return (selection.bounds) ? true : false; }
    catch(e) { return false; }
}

function isIntersected(path, point){
    var sqrt = Math.sqrt;
    var pow = Math.pow;

    for(i=0; i<path.length; i++){
        var s = sqrt( pow(path[i][0]-point[0], 2) + pow(path[i][1]-point[1], 2) )
        if (s < 1) return true;
    }
    
    return false;
}

function setColor(point){
    var id = doc.activeLayer.name
    var fX = point[0];
    var fY = point[1];

    var Left = fX-2;
    var Right = fX+2;
    var Top = fY-2;
    var Bottom = fY+2;
    
    var fillColour = new SolidColor();
    fillColour.rgb.hexValue="ff0000";
    
    doc.selection.select([[Left,Top],[Right,Top],[Right,Bottom],[Left,Bottom]], SelectionType.REPLACE, 0, false);
    
    executeAction(charIDToTypeID( "CpTL" ), undefined, DialogModes.NO );
    
    doc.selection.select([[Left,Top],[Right,Top],[Right,Bottom],[Left,Bottom]], SelectionType.REPLACE, 0, false);
    doc.selection.fill(fillColour);
    
    doc.selection.deselect();    
    doc.activeLayer = doc.artLayers.getByName(id);
}



    


// Reset to previous unit prefs (optional)
app.preferences.rulerUnits = startRulerUnits;
app.preferences.typeUnits = startTypeUnits;