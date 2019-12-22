class map{
    constructor(){
        this.mapData,
        this.electionData,
        this.width,
        this.height,
        this.projection = d3.geoAlbers().rotate([0, 0]), //rotate makes it the right way up
        this.path = d3.geoPath().projection(this.projection),
        this.active = null,
        this.svg,
        this.g,
        this.zoom,
        this.colours,
        this.name1,
        this.name2,
        this.constituency,
        this.candidate,
        this.party,
        this.scale = 0.98
    }

    removePrevious(element){
        var isEmpty = d3.select(element).empty();
        
        if (isEmpty === false){
            d3.select(element).remove();
        }
    }
    
    init (mapPath, dataPath, colours, elementID, name1, name2, constituency, candidate, party, scale){
        this.name1 = name1;
        this.name2 = name2;
        this.constituency = constituency;
        this.candidate = candidate;
        this.party = party;
        this.width = document.getElementById(elementID).clientWidth;
        this.height = document.getElementById(elementID).clientHeight;
        
        if (scale != null){
            this.scale = scale;
        }
        
        this.svg = d3.select('#'+elementID)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);
        
        this.g = this.svg.append("g");
        this.getData(mapPath, dataPath, colours);
        this.zoom = d3.zoom().on("zoom", this.zoomed.bind(this));
        this.svg.call(this.zoom);
    }

    getData(mapPath, dataPath, colours){
        d3.queue()
            .defer(d3.json, mapPath)
            .defer(d3.csv, dataPath)
            .defer(d3.json, colours)
            .await(this.ready.bind(this))
    }
    
    ready(error, mapData, electionData, colours){
        if (error != null){
            alert("This error occurred while reading the data files: "+error)
        }
        else{
            this.mapData = mapData;
            this.electionData = electionData;
            this.colours = colours;
            this.draw();
        }
    }

    draw(){
        this.projection.scale(1).translate([0,0]);
        let b = this.path.bounds(topojson.feature(this.mapData, this.mapData.objects[this.name1]));
        let s = this.scale / Math.max((b[1][0] - b[0][0])/this.width, (b[1][1] - b[0][1])/this.height);
        let t = [(this.width - s * (b[1][0] + b[0][0]))/2, (this.height - s * (b[1][1] + b[0][1]))/2];
        this.projection.scale(s).translate(t);
        
        //select the rendered "g" element
        let areas = this.g.selectAll(".area").data(topojson.feature(this.mapData, this.mapData.objects[this.name1]).features);
        
        //enter data i.e. append all the path elements that make up the map 
        areas.enter()
            .append('path')
            .attr("class", 'area')
            .attr("fill", this.fillColour.bind(this))
            .attr("id", function(d){return d["properties"][this.name2]}.bind(this))
            .attr("d", this.path)
            .on('click', this.clicked.bind(this));
    }

    clicked(d){
        let selectedNode = d["properties"][this.name2];
        let info = d3.selectAll(".info");
   
        if(this.active != null && this.active.id === selectedNode){
            this.resetActive();
            info.style("visibility", "hidden");   
        }
        else{
            if (this.active != null){
                this.resetActive();
            }
            info.style("visibility", "visible");
            this.active = document.getElementById(selectedNode);
            this.active.style.opacity = 0.5;
            this.active.style.strokeWidth = '2px';
            this.displayInfo(selectedNode);
        }    
    }

    resetActive(){
        this.active.style.opacity  = 1.0;
        this.active.style.strokeWidth = '0.5px';
        this.active = null;
    }

    displayInfo(d){        
        let partyName = '';
        let mpName = '';
    
        for (var i = 0; i < this.electionData.length; i++){
            if(this.electionData[i][this.constituency] === d){
                partyName = this.electionData[i][this.party];
                mpName = this.electionData[i][this.candidate];
            }
        }
        
        let result = "Won by "+partyName+" party candidate "+mpName;
        if (result === "Won by  party candidate "){
            result = "Data is not available for this departement.";
        }

        d3.select("#constituency").text(d);
        d3.select("#result").text(result);
    }

    fillColour(d){
        for(var i = 0; i < this.electionData.length; i++) {
            if( this.electionData[i][this.constituency] === d.properties[this.name2] ) {
                return this.colours[this.electionData[i][this.party]];
                }
            }
        return "#ffffff";  
    }

    zoomed(){
        this.g.attr("transform", d3.event.transform);
    }
}


function round1(){
    france = new map();
    france.removePrevious('svg');
    france.init(
        "france_2017/departements.json",
        "france_2017/round1.csv", 
        "france_2017/colours.json",
        "vis", "FRA_adm2-1", "NAME_2", "departement", "candidate", "party"
        );
}

function round2(){
    france = new map();
    france.removePrevious('svg');
    france.init(
        "france_2017/departements.json",
        "france_2017/round2.csv",
        "france_2017/colours.json", 
        "vis", "FRA_adm2-1", "NAME_2", "departement", "candidate", "party"
        );
}

function selectMap(){
    document.addEventListener("DOMContentLoaded", function(){
        var button1 = document.getElementById("round1");
        var button2 = document.getElementById("round2");
        button1.addEventListener("click", round1);
        button2.addEventListener("click", round2);
        });
}

selectMap()