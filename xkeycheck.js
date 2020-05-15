
// Fix up prefixing


var onstrength = {};

var inputSelIdx = null;

window.addEventListener('load', init, false);
var midishortcut = {
	pause: [0x90, 0x1a, function(v){ return v>0; }],
	rewind: [0x90, 0x18, function(v){ return v>0; }],
	forward: [0x90, 0x1c, function(v){ return v>0; }]
}

function init() {
  
  prepareMIDI();

}

function onError(evt)
{
	alert("Error");
}

function prepareMIDI(){
    navigator.requestMIDIAccess({
        sysex: false
    }).then(function (access) {
		// MIDI Inputデバイスの配列を作成
		midi = {inputs: [], outputs:[]};
		var select = document.getElementById('midiin');
		
		var inputIterator = access.inputs.values();
		var i = 0;
		for (var o = inputIterator.next(); !o.done; o = inputIterator.next()) {
			midi.inputs.push(o.value);
			console.log(o.value);
			
			var option = document.createElement('option');
 
			option.setAttribute('value', i+1);
			option.innerHTML = o.value.name;
 
			select.appendChild(option);
			
			++i;
		}
		
		select.addEventListener("change", function(event){
			if(inputSelIdx!=null && inputSelIdx > 0)
				midi.inputs[inputSelIdx-1].onmidimessage=null;                                                                                        
			
			if(event.target.value > 0){
				midi.inputs[event.target.value-1].onmidimessage=OnMidiMessage;
			}
			
			inputSelIdx = event.target.value;
		});
 
		// MIDI Outputデバイスの配列を作成
		var outputIterator = access.outputs.values();
		for (var o = outputIterator.next(); !o.done; o = outputIterator.next()) {
			midi.outputs.push(o.value);
			console.log(o.value);
		}
		
    }, function (err) {
 	   alert("MIDI ERROR");
        console.dir(err);
    });
}

function MatchUint8Array(a,b){
	// b shall be Uint8Array
	// a can be array of number or function
	if(a.length != b.length) return false;
	
	for(var i = 0; i < a.length; ++i){
		if(typeof(a[i]) == 'function'){
			var ret = a[i](b[i]);
			if(!ret) return false;
		}else if(a[i] != b[i])
			return false;
	}
	
	return true;
}

function MidiMsgMathcher(evt)
{
	if( midishortcut.pause && MatchUint8Array(midishortcut.pause,evt.data) )
		pause();
	else if( midishortcut.rewind && MatchUint8Array(midishortcut.rewind,evt.data))
		rewind();
	else if( midishortcut.forward && MatchUint8Array(midishortcut.forward,evt.data))
		forward();
}

function OnMidiMessage(evt)
{
	//console.log(evt);
	var msgstr = "";
	// Ingore
	if (evt.data.length == 1 && evt.data[0] == 0xf8)
		return;
	if (evt.data.length == 1 && evt.data[0] == 0xfe)
		return;
	for(var i = 0; i < evt.data.length; ++i){
		msgstr += evt.data[i].toString(16) + " ";
	}
	if(evt.data.length > 0){
		if(evt.data[0] == 0x90){
			var key = evt.data[1];
			var vol = evt.data[2];
			if (!(key in onstrength)){
				onstrength[key] = [0,0];
			}

			onstrength[key][0] = onstrength[key][0] + 1;
			onstrength[key][1] = onstrength[key][1] + vol;
			
			var retstr = "";
			for(var key in onstrength){
				var avg = (onstrength[key][1]/onstrength[key][0]);
				var lvlstr = "";
				for(var i = 0; i < avg; ++i)
					lvlstr = lvlstr + "|";
				retstr = retstr + key + " : " + lvlstr + " : " + avg.toFixed(2) + "\n";
			}
			$("#ret").val(retstr);
		}
	}
			
	console.log(msgstr);
	
	MidiMsgMathcher(evt);
}
