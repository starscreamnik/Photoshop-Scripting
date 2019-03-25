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

function sendGroupById(id){
    doc.activeLayer = doc.artLayers.getByName(id);
    createFolder("~/Desktop/" + doc.name + "/g" + id);

    selectLayerPixels();

    doc.selection.makeWorkPath(0.1); 	// set tolerance (in PIXELS). 0 for sharp corners
    var wPath = doc.pathItems['Рабочий контур'];
    var subPaths = wPath.subPathItems;
    var isAdded = false;

    for (i=0; i<subPaths.length; i++){	// 0 - n-1
        var jsonFile = new File("~/Desktop/" + doc.name + "/g"+ id + "/" + (i+1) + ".json");
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
                isAdded = isAdded? true : addGroupColor(currPoint);
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
	return 1;
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
}
  
function addGroupColor(currPoint){
    var pSample = doc.colorSamplers.add([(currPoint[0]-1), (currPoint[1])-1]);
    var rgb = [
        pSample.color.rgb.red,
        pSample.color.rgb.green,
        pSample.color.rgb.blue,
    ];
    doc.colorSamplers.removeAll(); 

    if((rgb[0]+rgb[1]+rgb[2])/3 > 220) return false;

    colors.push('"' + rgbToHex(Math.round(rgb[0]), Math.round(rgb[1]), Math.round(rgb[2])) + '"');
    return true;
}

function saveInfoToJson(){
    var json = '{\n\t"groupNum": ' + groups + ',' +
                '\n\t"centerX" : ' + Math.round(doc.width/2) + ',' +
                '\n\t"centerY" : ' + Math.round(doc.height/2) + ',' +
                '\n\t"layers"  : ' + '[' + layers.join(',') + '],' +
                '\n\t"colors"  : ' + '[' + colors.join(',') + ']\n}';
    var infoFile = new File("~/Desktop/" + doc.name + "/info.json")
    infoFile.open("w");
    infoFile.write(json);
    infoFile.close();
}

function savePNG(){ 
    doc.artLayers.getByName("line").visible = true;
    doc.artLayers.getByName("bg").visible = false;

    var saveFile = new File("~/Desktop/" + doc.name + "/main.png");
    var pngSaveOptions = new PNGSaveOptions(); 
    doc.saveAs(saveFile, pngSaveOptions, true, Extension.LOWERCASE); 
}

function exportGroupsToJson(){
	var id = 1;
	if(!doc.artLayers.getByName(id)){
		alert('At first create groups of objects\nGroup name: i (i=1,n)');
		return;
	} else alert('Lets start!');

	try{
        var counter = 0;
        for(var i=0; i<doc.artLayers.length; i++)
            doc.artLayers[i].visible = false
        doc.artLayers.getByName("bg").visible = true;
		for(var i=0; i<doc.artLayers.length; i++) 
            if(doc.artLayers[i].name == i){
                doc.artLayers[i].visible = true;
                counter += sendGroupById(i);
                doc.artLayers[i].visible = false;
                groups++;
            }
	}
	catch(error){
		alert(error);
	}	
}

exportGroupsToJson();
saveInfoToJson();
savePNG();

// Reset to previous unit prefs (optional)
app.preferences.rulerUnits = startRulerUnits;
app.preferences.typeUnits = startTypeUnits;