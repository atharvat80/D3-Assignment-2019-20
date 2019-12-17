class map{
    constructor(){
        this.mapData,
        this.electionData,
        this.width = document.getElementById("vis").clientWidth,
        this.height = 0.9*document.getElementById("vis").clientHeight,
        this.projection = d3.geoAlbers().rotate([0, 0]),
        this.active,
        this.svg,
        this.g,
        this.path,
        this.zoom
    }
    
    // Process data from input files
    init (error, mapData, electionData){
        this.path = d3.geoPath().projection(this.projection);
        this.svg = d3.select("#vis")
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);
        this.g = this.svg.append("g");
        this.mapData = mapData;
        this.electionData = electionData;
        this.active = d3.select(null);
        this.draw();
        //this.zoom = d3.zoom().on("zoom", this.handleZoom());
        //this.svg.call(this.zoom);
    }
    
    // Draw map
    draw(){
        this.projection.scale(1).translate([0,0]);
        let b = this.path.bounds(topojson.feature(this.mapData, this.mapData.objects["wpc"]));
        let s = .95 / Math.max((b[1][0] - b[0][0])/this.width, (b[1][1] - b[0][1])/this.height);
        let t = [(this.width - s * (b[1][0] + b[0][0]))/2, (this.height - s * (b[1][1] + b[0][1]))/2];
        this.projection.scale(s).translate(t);

        let _this = this;
    
        // select
        let areas = this.g.selectAll(".area").data(topojson.feature(this.mapData, this.mapData.objects["wpc"]).features);
        
        // enter
        areas
        .enter()
        .append('path')
        .attr("class", 'area')
        .attr("fill", function (d){
            for(var i = 0; i < _this.electionData.length; i++) {
                if( _this.electionData[i].PC_ID === d.properties.PC_ID ) {
                    return _this.electionData[i].Colour;
                    }
                }
            return "#ffffff";  
        })
        .attr("id", function(d){ return d.properties.PC_ID; })
        .attr("d", this.path)
        .on('click', function(d){
            if(_this.active.node() === this) {
                this.reset();
                } 
            else {
                _this.active.style("opacity", 1.0);
                _this.active.style("stroke", "#000");
                _this.active = d3.select(this);
                _this.active.style("opacity", 0.75)
                _this.active.style("stroke", "#c0c0c0");
            
                d3.select("#info")
                    .classed("active", true)
                    .style("top", "30px")
                    .style("left", "30px");
                
                _this.displayInfo(d)
            }
        });
    }

    // change colour of the constituency when clicked
    clicked(d){
        if(this.active.node() === this) {
            this.reset();
            } else {
            this.active.style("opacity", 1.0);
            this.active.style("stroke", "#000");
            this.active = d3.select(this);
            this.active.style("opacity", 0.75)
            this.active.style("stroke", "#c0c0c0");
        
            d3.select("#info")
                .classed("active", true)
                .style("top", "30px")
                .style("left", "30px");
            
            this.displayInfo(d)
        }
    }

    // Display information about a constituency when clicked
    displayInfo(d){
        let partyName = '';
        let mpName = '';
        let conName= '';
    
        for (var i = 0; i < this.electionData.length; i++){
            if(this.electionData[i].PC_ID === d.properties.PC_ID){
                partyName = this.electionData[i].Party;
                mpName = this.electionData[i].Name
                conName= this.electionData[i].Constituency;
            }
        }
    
        d3.select("#con_name").text(conName);
        d3.select("#party_name").text(partyName);
        d3.select("#mp_name").text(mpName);
    }

    // Zoom when double clicked
    handleZoom(){
        this.g.attr('transform', d3.event.transform);
    }
    
    // Reset colour and hide information once the active constituency has been clicked again
    reset(){
        this.active.style("opacity", 1.0);
        this.active.style("stroke", "#000");
        this.active = d3.select(null)
    
        d3.select("#info")
        .classed("active", false)
        .style("top", height + "px")
        .style("left", width + "px");
    }
}


uk = new map();

async function setData(error, mapData, electionData){
    uk.init(error, mapData, electionData)
    }

d3.queue()
        .defer(d3.json, "/original_code/wpc.json")
        .defer(d3.csv, "/original_code/mp_data.csv")
        .await(setData);