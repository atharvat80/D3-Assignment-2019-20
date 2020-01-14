// Source https://bl.ocks.org/miguelrofer/ac1ec983fc8c1d0b8677259e6bb96198
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



// initialise our visualisation
function init() {

    width = document.getElementById("vis").clientWidth;
    height = document.getElementById("vis").clientHeight;

    projection = d3.geoAlbers()
     .rotate([0, 0]);
    path = d3.geoPath()
     .projection(projection);


     // global zoom behaviour
     var zoom = d3.zoom()
      .on("zoom", handle_zoom);
     function handle_zoom() {
      g.attr('transform', d3.event.transform);
     }

     // load up data

       d3.queue()
        .defer(d3.json, "wpc.json")
        .defer(d3.csv, "mp_data.csv")
        .await(function(error, boundary_data, mp_data){
            console.log(mp_data);
            cons_data = mp_data;
            draw(boundary_data);

          // global variable stores currently selected constituency
          var active = d3.select(null);
          // ???????
          // reset function returns to default state
          function reset() {
           active.style("opacity", 1.0);
           active.style("stroke", "#000");
           active = d3.select(null)

           d3.select("#info")
           .classed("active", false)
           .style("top", height + "px")
           .style("left", width + "px");
           svg.transition()
             .duration(750)
             .call(zoom.transform, d3.zoomIdentity);
          }


        function clicked(d){

          if(active.node() === this) {
          reset();
          } else {
          active.style("opacity", 1.0);
          active.style("stroke", "#000");
          active = d3.select(this);
          active.style("opacity", 0.9)
          active.style("stroke", "#c0c0c0");

          // ??????

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


       function draw(wpcs) {

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

        draw(boundary_data);



    });


    svg = d3.select("#vis")
            .append("svg")
            .attr("width", width)
            .attr("height", height);


    g = svg.append("g");



    svg.call(zoom);
}

init();