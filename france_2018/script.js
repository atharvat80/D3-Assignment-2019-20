class map{
    constructor(){
        this.mapData,
        this.electionData,
        this.width,
        this.height,
        this.projection = d3.geoAlbers().rotate([0, 0]),
        this.active = d3.select(null),
        this.svg,
        this.g,
        this.path,
        this.zoom,
        this.colours
    }
    
    // Process data from input files
    init (mapPath, dataPath, fill){
        
        // Initialise variables required to draw the map
        this.width = document.getElementById('vis').clientWidth,
        this.height = document.getElementById('vis').clientHeight,
        this.path = d3.geoPath().projection(this.projection);
        
        this.svg = d3.select('#vis')
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);
        this.g = this.svg.append("g");
        
        // Get data of required to draw the map
        this.getData(mapPath, dataPath, fill)
        
        // Initialise variables and methods required to interact with the map
        this.zoom = d3.zoom().on("zoom", this.zoomed.bind(this))
        this.svg.call(this.zoom)
    }

    //Get data required for the visualisation
    getData(mapPath, dataPath, fill){
        d3.queue()
            .defer(d3.json, mapPath)
            .defer(d3.csv, dataPath)
            .defer(d3.json, fill)
            .await(this.ready.bind(this))
    }

    // Handle zoom function
    zoomed(){
        this.g.attr("transform", d3.event.transform);
    }
    
    // Draw the map or show error occurred while loading the data 
    ready(error, mapData, electionData, colours){
        if (error != null){
            alert(error)
        }
        else{
            this.mapData = mapData;
            this.electionData = electionData;
            this.colours = colours;
            this.draw();
        }
    }

    // Draw map
    draw(){
        let objectName = "FRA_adm2-1";
        this.projection.scale(1).translate([0,0]);
        let b = this.path.bounds(topojson.feature(this.mapData, this.mapData.objects[objectName]));
        let s = .95 / Math.max((b[1][0] - b[0][0])/this.width, (b[1][1] - b[0][1])/this.height);
        let t = [(this.width - s * (b[1][0] + b[0][0]))/2, (this.height - s * (b[1][1] + b[0][1]))/2];
        this.projection.scale(s).translate(t);
    
        // select
        this.areas = this.g.selectAll(".area").data(topojson.feature(this.mapData, this.mapData.objects[objectName]).features);
        
        // enter
        this.areas
            .enter()
            .append('path')
            .attr("class", 'area')
            .attr("fill", this.fillColour.bind(this))
            .attr("id", function(d){ return d.properties.NAME_2; })
            .attr("d", this.path)
            .on('click', this.clicked.bind(this));
    }


    // change colour of the constituency when clicked or unclicked
    clicked(d){
        let activeNode = "#"+d.properties.NAME_2;
        if (this.active.node() === d3.select(activeNode).node()){
            this.resetActive();
        }
        else if(this.active.node() != null){
            this.resetActive();
        }
        else{
            this.active = d3.select(activeNode);
            this.active.style("opacity", 0.5)
            this.active.style("stroke", "#e7e7e7");
            
            d3.select("#departement").style("visibility", "visible");
            d3.select("#result").style("visibility", "visible");

            this.displayInfo(d)
        }
    }


    // Display information about a constituency when clicked
    displayInfo(d){        
        let partyName = '';
        let mpName = '';
        let conName= '';
    
        for (var i = 0; i < this.electionData.length; i++){
            if(this.electionData[i].departement === d.properties.NAME_2){
                partyName = this.electionData[i].party;
                mpName = this.electionData[i].candidate;
                conName= this.electionData[i].departement;
            }
        }
        let result = "Won by "+partyName+" party candidate "+mpName;
        d3.select("#departement").text(conName);
        d3.select("#result").text(result);
    }

    // return the colour the constituency should be filled with
    fillColour(d){
        for(var i = 0; i < this.electionData.length; i++) {
            if( this.electionData[i].departement === d.properties.NAME_2 ) {
                return this.colours[this.electionData[i]['candidate']];
                }
            }
        return "#ffffff";  
    }

    // // Reset colour and hide information once the active constituency has been clicked again
    resetActive(){
        this.active.style("opacity", 1.0);
        this.active.style("stroke", "#E7E7E7");
        this.active = d3.select(null);

        d3.select("#departement").style("visibility", "hidden");
        d3.select("#result").style("visibility", "hidden");
    }
}

france = new map();

function removePrevious(){
    var current = d3.select("svg").empty();
    if (current === false){
        d3.select('svg').remove()
    }
}

function round1(){
    removePrevious()
    france.init("departements.json","round1.csv", "colours.json");
}

function round2(){
    removePrevious()
    france.init("departements.json","round2.csv", "colours.json");
}

document.addEventListener("DOMContentLoaded", function(){
    var button1 = document.getElementById("round1");
    var button2 = document.getElementById("round2");
    button1.addEventListener("click", round1);
    button2.addEventListener("click", round2);
    });

//source https://geo.nyu.edu/catalog/stanford-fs569ct0668