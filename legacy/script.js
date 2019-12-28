// dimensions of visualisation
var width;
var height;
// 'svg' to draw in, 'g' element to group everything together
var svg;
var g;
// projection to convert from coordinates to pixels
var projection;
// path function to create line paths
var path;
var cons_data;
// variable to store currently selected constituency
var active = d3.select(null);
// global zoom behaviour
var zoom = d3.zoom().on("zoom", handle_zoom);

// initialise our visualisation
function init() {
  width = document.getElementById("vis").clientWidth;
  height = document.getElementById("vis").clientHeight;

  projection = d3.geoAlbers().rotate([0, 0]);
  path = d3.geoPath().projection(projection);

  // load up data
  d3.queue()
  .defer(d3.json, "https://raw.githubusercontent.com/atharvat80/D3_Assignment/master/original_code/wpc.json?token=AMFZ23YBSBHSRNOO3H2TGOK57DFOI")
  .defer(d3.csv, "https://raw.githubusercontent.com/atharvat80/D3_Assignment/master/original_code/mp_data.csv?token=AMFZ23YADQAGDXHKRSVNUS257DFMM")
  .await(function(error, boundary_data, mp_data){
      cons_data = mp_data;
      draw(boundary_data, cons_data);
      });

  svg = d3.select("#vis")
          .append("svg")
          .attr("width", width)
          .attr("height", height);

  g = svg.append("g");
  
  svg.call(zoom);
}

// Draw function
function draw(wpcs, cons_data) {

  projection
  .scale(1)
  .translate([0,0]);

  var b = path.bounds(topojson.feature(wpcs, wpcs.objects["wpc"]));
  var s = .95 / Math.max((b[1][0] - b[0][0])/width, (b[1][1] - b[0][1])/height);
  var t = [(width - s * (b[1][0] + b[0][0]))/2, (height - s * (b[1][1] + b[0][1]))/2];
  projection
  .scale(s)
  .translate(t);

  // select
  var areas = g.selectAll(".area")
  .data(topojson.feature(wpcs, wpcs.objects["wpc"]).features);
  // enter
  areas
  .enter()
  .append('path')
  .attr("class", 'area')
  .attr("fill", function(d){
    for(var i = 0; i < cons_data.length; i++) {
      if( cons_data[i].PC_ID === d.properties.PC_ID ) {
        return cons_data[i].Colour;
      }
    }
      return "#ffffff";
    })
  .attr("id", function(d){ return d.properties.PC_ID; })
  .attr("d", path)
  .on('click', clicked);

}

// mouse scroll wheel, pinch and double click zoom 
function handle_zoom() {
  console.log(d3.event);
  g.attr('transform', d3.event.transform);
 }

// zoom in when clicked
function zoom_on_click(){
  var b = path.bounds(d);
  var dx = b[1][0] - b[0][0];
  var dy = b[1][1] - b[0][1];
  var x = (b[0][0] + b[1][0]) / 2;
  var y = (b[0][1] + b[1][1]) / 2;
  var s = 0.95 / Math.max(dx/width, dy/height);
  var t = [width/2 - s * x, height/2 - s * y];
  var tform = d3.zoomIdentity.translate(t[0], t[1]).scale(s);
  svg.transition()
     .duration(750)
     .call(zoom.transform, tform);
}

// reset function returns to default state
function reset() {
  active.style("opacity", 1.0);
  active.style("stroke", "#000");
  active = d3.select(null)

  d3.select("#info")
  .classed("active", false)
  .style("top", height + "px")
  .style("left", width + "px");
  //reset zoom
  // svg.transition()
  //   .duration(750)
  //   .call(zoom.transform, d3.zoomIdentity);
 }

function clicked(d){
  if(active.node() === this) {
    reset();
  } else {
    active.style("opacity", 1.0);
    active.style("stroke", "#000");
    active = d3.select(this);
    active.style("opacity", 0.75)
    active.style("stroke", "#c0c0c0");

    d3.select("#info")
        .classed("active", true)
        .style("top", "30px")
        .style("left", "30px");

    var party_name='';
    var mp_name='';
    var con_name='';

    for (var i = 0; i < cons_data.length; i++){
      if(cons_data[i].PC_ID === d.properties.PC_ID){
        party_name = cons_data[i].Party;
        mp_name = cons_data[i].Name
        con_name=cons_data[i].Constituency;
      }
    }

    d3.select("#con_name")
        .text(con_name);
    d3.select("#party_name")
        .text(party_name);
    d3.select("#mp_name")
        .text(mp_name);
}
}

init();