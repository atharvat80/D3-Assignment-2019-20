let map = {
    width: document.getElementById("vis").clientWidth,
    height: 0.9*document.getElementById("vis").clientHeight,
    projection: d3.geoAlbers().rotate([0, 0]),
    active: d3.select(null),
}


// Process data from input files
map.init = function(mapdataPath, datasetPath){
    map.path = d3.geoPath().projection(map.projection)

    //load data
    d3.queue()
        .defer(d3.json, mapdataPath)
        .defer(d3.csv, datasetPath)
        .await(map.ready)

    map.svg = d3.select("#vis")
        .append("svg")
        .attr("width", this.width)
        .attr("height", this.height);

    map.g = map.svg.append("g");
    map.zoom = d3.zoom().on("zoom", map.handleZoom),
        map.svg.call(map.zoom);
}


// Draw map once data has been loaded
map.ready = function(error, country, electionData){
    map.electionData = electionData;
    map.draw(country);
}


// Draw map
map.draw = function(country){
    map.projection.scale(1).translate([0,0]);
    let b = map.path.bounds(topojson.feature(country, country.objects["wpc"]));
    let s = .95 / Math.max((b[1][0] - b[0][0])/map.width, (b[1][1] - b[0][1])/map.height);
    let t = [(map.width - s * (b[1][0] + b[0][0]))/2, (map.height - s * (b[1][1] + b[0][1]))/2];
    map.projection.scale(s).translate(t);

    // select
    let areas = map.g.selectAll(".area").data(topojson.feature(country, country.objects["wpc"]).features);

    // enter
    areas
        .enter()
        .append('path')
        .attr("class", 'area')
        .attr("fill", function(d){
            for(var i = 0; i < map.electionData.length; i++) {
                if( map.electionData[i].PC_ID === d.properties.PC_ID ) {
                    return map.electionData[i].Colour;
                }
            }
            return "#ffffff";
        })
        .attr("id", function(d){ return d.properties.PC_ID; })
        .attr("d", map.path)
        .on('click', map.clicked);
}


// change colour of the constituency when clicked
map.clicked = function(d){
    if(map.active.node() === this) {
        map.reset();
    } else {
        map.active.style("opacity", 1.0);
        map.active.style("stroke", "#000");
        map.active = d3.select(this);
        map.active.style("opacity", 0.75)
        map.active.style("stroke", "#c0c0c0");

        d3.select("#info")
            .classed("active", true)
            .style("top", "30px")
            .style("left", "30px");

        map.displayInfo(d)
    }
}


// Display information about a constituency when clicked
map.displayInfo = function(d){
    let partyName = '';
    let mpName = '';
    let conName= '';

    for (var i = 0; i < map.electionData.length; i++){
        if(map.electionData[i].PC_ID === d.properties.PC_ID){
            partyName = map.electionData[i].Party;
            mpName = map.electionData[i].Name
            conName= map.electionData[i].Constituency;
        }
    }

    d3.select("#con_name").text(conName);
    d3.select("#party_name").text(partyName);
    d3.select("#mp_name").text(mpName);
}


// Zoom when double clicked
map.handleZoom = function(){
    map.g.attr('transform', d3.event.transform);
}

// reset colour and hide information once the active constituency has been clicked again
map.reset = function(){
    map.active.style("opacity", 1.0);
    map.active.style("stroke", "#000");
    map.active = d3.select(null)

    d3.select("#info")
        .classed("active", false)
        .style("top", height + "px")
        .style("left", width + "px");
}


map.init("/original_code/wpc.json","/original_code/mp_data.csv");