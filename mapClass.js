class map{
    constructor(mapdataPath, datasetPath){
        this.mapdataPath = mapdataPath;
        this.datasetPath = datasetPath;
        this.electionData;
        this.width = document.getElementById("vis").clientWidth;
        this.height = document.getElementById("vis").clientHeight;
        this.svg;
        this.g;
        this.projection = d3.geoAlbers().rotate([0, 0]);
        this.path = d3.geoPath().projection(this.projection);
        this.active = d3.select(null);
        this.zoom = d3.zoom().on("zoom", this.handleZoom);
    }

    // Process data from input files
    init(){
        //load data
        d3.queue()
        .defer(d3.json, this.mapdataPath)
        .defer(d3.csv, this.datasetPath)
        .await(this.ready)
        
        this.svg = d3.select("#vis")
          .append("svg")
          .attr("width", this.width)
          .attr("height", this.height);

        this.g = this.svg.append("g");
        
        this.svg.call(this.zoom);
    }

    // Draw map once data has been loaded
    ready(error, country, electionData){
        map.electionData = electionData;
        console.log(map.electionData)
        map.draw(country, map.electionData);
    }

    // Draw map
    draw(country){
        this.projection.scale(1).translate([0,0]);
        
        var b = this.path.bounds(topojson.feature(country, country.objects["wpc"]));
        var s = .95 / Math.max((b[1][0] - b[0][0])/this.width, (b[1][1] - b[0][1])/this.height);
        var t = [(this.width - s * (b[1][0] + b[0][0]))/2, (this.height - s * (b[1][1] + b[0][1]))/2];
        
        this.projection.scale(s).translate(t);

        // select
        var areas = this.g.selectAll(".area")
        .data(topojson.feature(country, country.objects["wpc"]).features);
        
        // enter
        areas
        .enter()
        .append('path')
        .attr("class", 'area')
        .attr("fill", function(d){
            for(var i = 0; i < this.electionData.length; i++) {
                if( this.electionData[i].PC_ID === d.properties.PC_ID ) {
                    return this.electionData[i].Colour;
                    }
                }
            return "#ffffff";
            })
        .attr("id", function(d){ return d.properties.PC_ID; })
        .attr("d", this.path)
        .on('click', self.clicked);
    }


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


    handleZoom(){
        this.g.attr('transform', d3.event.transform);
    }


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

let uk = new map(
    "https://raw.githubusercontent.com/atharvat80/D3_Assignment/master/original_code/wpc.json?token=AMFZ23YBSBHSRNOO3H2TGOK57DFOI",
    "https://raw.githubusercontent.com/atharvat80/D3_Assignment/master/original_code/mp_data.csv?token=AMFZ23YADQAGDXHKRSVNUS257DFMM"
);
uk.init();