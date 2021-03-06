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

var dirPath = "~/Desktop/";
var round = Math.round;


exportGroupsToJson();
saveInfoToJson();
savePNG();

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
    
        var currGroup = 0;
		for(var i=0; i<doc.artLayers.length; i++){
            if(doc.artLayers[i].name == i){ // first layer's name equals "1", second - "2", etc.
                doc.artLayers[i].visible = true;
                var isDone = sendGroupById(i, currGroup+1);
                if (isDone) currGroup++;
                doc.artLayers[i].visible = false;
            }
        }
        groups = currGroup;
	}
	catch(error){
		alert(error);
	}	
}

function sendGroupById(id, currGroup){
    doc.activeLayer = doc.artLayers.getByName(id);

    selectLayerPixels();
    if (isSelected(doc.selection) == false) {
        alert("This selection is empty")
        return false;
    }

    var groupPath = dirPath + doc.name + "/g" + currGroup;
    createFolder(groupPath);

    doc.selection.makeWorkPath(0.1); 	// set tolerance (in PIXELS). 0 for sharp corners
    var wPath = doc.pathItems['Рабочий контур'];
    var subPaths = wPath.subPathItems;
    var isAdded = false;

    for (var i=0; i<subPaths.length; i++){	// 0 - n-1
        var jsonFile = new File(groupPath + "/" + (i+1) + ".json");
        jsonFile.open("w");
        var bounds = {minX : 10000, minY : 10000, maxX : 0, maxY : 0};
        var stride = 1; // 2 means every 2nd, 3 means every 3rd, etc. Minimum 1
        var coords = [];

        var mainPath = subPaths[i].pathPoints;
        var length = mainPath.length;
        for (var j=0; j<length; j++) {
            if (j % stride === 0) {
                var currPoint = mainPath[j].anchor;    
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

    if (!isAdded) colors.push('"ffffff"');
    layers.push(subPaths.length)
 
    wPath.remove();
	return true;
}

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

function isSelected(selection){
    try      { return (selection.bounds) ? true : false; }
    catch(e) { return false; }
}

function updateCenterXY(bounds, currPoint){
	if (bounds.minX > currPoint[0]) bounds.minX = currPoint[0];
	if (bounds.minY > currPoint[1]) bounds.minY = currPoint[1];
	if (bounds.maxX < currPoint[0]) bounds.maxX = currPoint[0];
	if (bounds.maxY < currPoint[1]) bounds.maxY = currPoint[1];
	return bounds;
}

function findGroupColor(currPoint){
    var curr_rgb = [255, 255, 255];

    for (var i = -5; i <= 5; i++){
        var dx_point = doc.colorSamplers.add([(currPoint[0]+i), (currPoint[1])]);
        var dy_point = doc.colorSamplers.add([(currPoint[0]), (currPoint[1]+i)]);
        var dxdy1_point = doc.colorSamplers.add([(currPoint[0]+i), (currPoint[1]+i)]);
        var dxdy2_point = doc.colorSamplers.add([(currPoint[0]+i), (currPoint[1]-i)]);


        dx_rgb = getRGB(dx_point);
        dy_rgb = getRGB(dy_point);
        dxdy1_rgb = getRGB(dxdy1_point); 
        dxdy2_rgb = getRGB(dxdy2_point);
        doc.colorSamplers.removeAll();

        if (getRgbValue(dx_rgb) < getRgbValue(curr_rgb)) curr_rgb = dx_rgb;
        if (getRgbValue(dy_rgb) < getRgbValue(curr_rgb)) curr_rgb = dy_rgb;
        if (getRgbValue(dxdy1_rgb) < getRgbValue(curr_rgb)) curr_rgb = dxdy1_rgb;
        if (getRgbValue(dxdy2_rgb) < getRgbValue(curr_rgb)) curr_rgb = dxdy2_rgb;
    } 

    if (getRgbValue(curr_rgb) > 250){
        alert("Troubled color of the group:", curr_rgb[0], curr_rgb[1], curr_rgb[2]);
        return false;
    }
    colors.push('"' + rgbToHex(round(curr_rgb[0]), round(curr_rgb[1]), round(curr_rgb[2])) + '"');
    return true;
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

function getRgbValue(rgb){
    return (rgb[0]+rgb[1]+rgb[2]) / 3;
}

function saveInfoToJson(){
    var json = '{\n\t"groupNum": ' + groups + ',' +
                '\n\t"centerX" : ' + round(doc.width/2) + ',' +
                '\n\t"centerY" : ' + round(doc.height/2) + ',' +
                '\n\t"layers"  : ' + '[' + layers.join(',') + '],' +
                '\n\t"colors"  : ' + '[' + colors.join(',') + ']\n}';
    var infoFile = new File(dirPath + doc.name + "/info.json")
    infoFile.open("w");
    infoFile.write(json);
    infoFile.close();
}

function savePNG(){ 
    doc.artLayers.getByName("line").visible = true;
    doc.artLayers.getByName("bg").visible = false;

    var saveFile = new File(dirPath + doc.name + "/main.png");
    var pngSaveOptions = new PNGSaveOptions(); 
    doc.saveAs(saveFile, pngSaveOptions, true, Extension.LOWERCASE); 
}

// Reset to previous unit prefs (optional)
app.preferences.rulerUnits = startRulerUnits;
app.preferences.typeUnits = startTypeUnits;