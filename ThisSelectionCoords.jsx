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

function createFolder(path){
	var folder = Folder(path);
	if(!folder.exists) folder.create();	
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

function exportSelectionToJson(){
	// Turn the selection into a work path and give it ref
	if (isSelected(doc.selection) == false) {
        alert("This selection is empty")
        return false;
    }

	doc.selection.makeWorkPath(0.1); 	// set tolerance (in PIXELS). 0 for sharp corners
	var wPath = doc.pathItems['Рабочий контур'];
    var subPaths = wPath.subPathItems;
    var jsonFile = new File("~/Desktop/coords.json");
    jsonFile.open("w");

    alert("Masks: " + (subPaths.length-1))

    var bounds = {minX : 10000, minY : 10000, maxX : 0, maxY : 0};
    var stride = 1; // 2 means every 2nd, 3 means every 3rd, etc. Minimum 1
    var coords = [];

    var start = Date.now()
    for (var j=0; j<subPaths[0].pathPoints.length; j++) {
        if (j % stride === 0) {
            var currPoint = subPaths[0].pathPoints[j].anchor;
            coords.push(currPoint[0])
            coords.push(currPoint[1])
            bounds = updateCenterXY(bounds, currPoint[0], currPoint[1]);
        }
    }
    var end = Date.now()
    alert("Work Time: " + (end-start)/1000)
 
    var json = '{"coords" : [' + coords.join(",")+'], ' +
                '"sourceX" : '+(bounds.minX+bounds.maxX)*0.5 + ',' +
                '"sourceY" : '+(bounds.minY+bounds.maxY)*0.5;

    if (subPaths.length > 1){
        json += ', "masks" :  ['
        for (i=1; i<subPaths.length; i++){	// 0 - n-1
            var bounds = {minX : 10000, minY : 10000, maxX : 0, maxY : 0};
            var stride = 1; 
            var coords = [];
            for (var j=0; j<subPaths[i].pathPoints.length; j++) {
                if (j % stride === 0) {
                    var currPoint = subPaths[0].pathPoints[j].anchor;
                    coords.push(currPoint[0]);
                    coords.push(currPoint[1]);
                    bounds = updateCenterXY(bounds, currPoint[0], currPoint[1]);
                }
            }
            json += '{"coords" : [' + coords.join(",")+'], ' +
                    '"sourceX" : '+(bounds.minX+bounds.maxX)*0.5 + ',' +
                    '"sourceY" : '+(bounds.minY+bounds.maxY)*0.5 + '}';
            if (i < subPaths.length - 1)
                json += ','
        }
        json += ']'
    }
    json += "}"

    jsonFile.write(json);

    jsonFile.close();
    wPath.remove();
    return true;
}

// Reset to previous unit prefs (optional)
app.preferences.rulerUnits = startRulerUnits;
app.preferences.typeUnits = startTypeUnits;