// Save the current unit preferences (optional)
var startRulerUnits = app.preferences.rulerUnits
var startTypeUnits = app.preferences.typeUnits
// Set units to PIXELS
app.preferences.rulerUnits = Units.PIXELS
app.preferences.typeUnits = TypeUnits.PIXELS
// Use the top-most document
var doc = app.activeDocument; 
var colors = [];
var layers = [];
var groups = 0;
var centerX, centerY;

function selectLayerPixels()
{
  var id710 = charIDToTypeID( "setd" );
  var desc168 = new ActionDescriptor();
  var id711 = charIDToTypeID( "null" );
  var ref128 = new ActionReference();
  var id712 = charIDToTypeID( "Chnl" );
  var id713 = charIDToTypeID( "fsel" );
  ref128.putProperty( id712, id713 );
  desc168.putReference( id711, ref128 );
  var id714 = charIDToTypeID( "T   " );
  var ref129 = new ActionReference();
  var id715 = charIDToTypeID( "Chnl" );
  var id716 = charIDToTypeID( "Chnl" );
  var id717 = charIDToTypeID( "Trsp" );
  ref129.putEnumerated( id715, id716, id717 );
  desc168.putReference( id714, ref129 );
  executeAction( id710, desc168, DialogModes.NO );
}

function createFolder(path){
	var folder = Folder(path);
	if(!folder.exists) folder.create();	
}

function updateCenterXY(bounds, currPoint){
	if (bounds.minX > currPoint[0]) bounds.minX = currPoint[0];
	if (bounds.minY > currPoint[1]) bounds.minY = currPoint[1];
	if (bounds.maxX < currPoint[0]) bounds.maxX = currPoint[0];
	if (bounds.maxY < currPoint[1]) bounds.maxY = currPoint[1];
	return bounds;
}

function sendGroupById(){
    selectLayerPixels();
    if (isSelected(doc.selection) == false) {
        alert("This selection is empty")
        return false;
    }

    createFolder("~/Desktop/newGroup");

    doc.selection.makeWorkPath(0.1); 	// set tolerance (in PIXELS). 0 for sharp corners
    var wPath = doc.pathItems['Рабочий контур'];
    var subPaths = wPath.subPathItems;
    var isAdded = false;

    for (var i=0; i<subPaths.length; i++){	// 0 - n-1
        var jsonFile = new File("~/Desktop/newGroup/" + (i+1) + ".json");
        jsonFile.open("w");

        var bounds = {minX : 10000, minY : 10000, maxX : 0, maxY : 0};
        var stride = 1; // 2 means every 2nd, 3 means every 3rd, etc. Minimum 1
        var coords = [];
        for (var j=0; j<subPaths[i].pathPoints.length; j++) {
            if (j % stride === 0) {
                var currPoint = subPaths[i].pathPoints[j].anchor;    
                coords.push(currPoint[0])
                coords.push(currPoint[1])
                bounds = updateCenterXY(bounds, currPoint);
                isAdded = isAdded? true : findGroupColor(currPoint);
            }
        }
        var json = '{"coords" : [' + coords.join(",") + '], ' +
                    '"sourceX" : '+(bounds.minX+bounds.maxX)*0.5 + ',' +
                    '"sourceY" : '+(bounds.minY+bounds.maxY)*0.5 + '}';
        jsonFile.write(json);     
        jsonFile.close();
    }
    layers.push(subPaths.length)
 
    wPath.remove();
	return true;
}

function isSelected(selection){
    try      { return (selection.bounds) ? true : false; }
    catch(e) { return false; }
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
}
  
function getRGB(point){
    return [
        point.color.rgb.red,
        point.color.rgb.green,
        point.color.rgb.blue,
    ];
}

function findGroupColor(currPoint){
    var done1 = done2 = false;
    for (var i = 3; i>-3; i--){
        var dxPoint = doc.colorSamplers.add([(currPoint[0]+i), (currPoint[1])]);
        var dyPoint = doc.colorSamplers.add([(currPoint[0]), (currPoint[1]+i)]);
        rgb1 = getRGB(dxPoint);
        rgb2 = getRGB(dyPoint);
        doc.colorSamplers.removeAll();

        if ((rgb1[0] + rgb1[1] + rgb1[2])/3 < 245){ 
            done1 = true;
            break;
        } else if ((rgb2[0] + rgb2[1] + rgb2[2])/3 < 245){
            done2 = true;
            break;
        }
    } 
    if (done1){
        colors.push('"' + rgbToHex(Math.round(rgb1[0]), Math.round(rgb1[1]), Math.round(rgb1[2])) + '"');
        return true;
    }
    if (done2){
        colors.push('"' + rgbToHex(Math.round(rgb2[0]), Math.round(rgb2[1]), Math.round(rgb2[2])) + '"');
        return true;
    }
    else return false;
}

function exportGroupsToJson(){
	var id = 1;
	if(!doc.artLayers.getByName(id)){
		alert('At first create groups of objects\nGroup name: i (i=1,n)');
		return;
	} else alert('Lets start!');

	try{
        for(var i=0; i<doc.artLayers.length-1; i++)
            doc.artLayers[i].visible = false
        doc.artLayers.getByName("bg").visible = true
    
        doc.activeLayer.visible = true;
        sendGroupById(doc.activeLayer.name);
	}
	catch(error){
		alert(error);
	}	
}

exportGroupsToJson();

// Reset to previous unit prefs (optional)
app.preferences.rulerUnits = startRulerUnits;
app.preferences.typeUnits = startTypeUnits;