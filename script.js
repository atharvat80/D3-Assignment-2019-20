/**
 * @fileOverview to do
 */

/**
 * Class that serves as a template for the visualisation. It contains all the attributes and methods required for the visualisation. 
*/
class map{
    /**Defines the attributes of class map
     * @example
     * var countryName = new map(); //creates a new instance of map
     * 
     * @property {Object} this.mapData - Stores the data of the topojson file of the chosen geographical area parsed by d3.json() 
     * @property {array} this.electionData - Stores the data of the chosen election's csv file parsed by d3.csv()
     * @property {number} this.width - Width of the svg element of the map
     * @property {number} this.height - Height of the svg element of the map
     * @property {function} this.projection - Defines which <a href="https://github.com/d3/d3-geo-projection">d3 projection</a> to use 
     * @property {Object} this.active - Stores the area that has been clicked on by the user
     * @property {Object} this.svg - Stores the svg element to be appended to an element of the specified ID of the page
     * @property {Object} this.g - Stores individual svg path elements of the constituencies as one element to form the svg of the country 
     * @property {function} this.path - Don't know what this does yet!
     * @property {function} this.zoom - handles an event when user tries to zoom
     * @property {Object} this.colours - Stores the colours used to represent candidate/party on the map 
     */
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

    /**
     * @param {string} element - specifies the element to be removed
     * @description Removes specified element <br><br> If we are using the same element to visualise more than one map, this function can be used 
     * to remove the previous map. This is required because d3 appends an svg element to the selected element as oppose to overriding it.
     * <ul>
     * <li><code>isEmpty: Boolean</code> - Stores the value returned by <code>d3.select(element).empty()</code></li>
     * <li><code>d3.select(element).empty()</code> returns true if element doesn't exists and returns false if the element does exist.</li>
     * <li><code>d3.select(element).remove()</code> removes the selected element if it exists</li>
     * </ul>
     */
    removePrevious(element){
        var isEmpty = d3.select(element).empty();
        
        if (isEmpty === false){
            d3.select(element).remove();
        }
    }
    
    /**
     * @param {string} mapPath - file path of the topojson file of the chosen geographical area
     * @param {string} dataPath - file path of the dataset
     * @param {string} colours - file path of the json file that defines the colours the party/candidate will be represented by on the map
     * @param {string} elementID - ID of the element that the svg of visualisation will be appended to
     * @description to do
     */
    init (mapPath, dataPath, colours, elementID){
        this.width = document.getElementById(elementID).clientWidth,
        this.height = document.getElementById(elementID).clientHeight,
        this.path = d3.geoPath().projection(this.projection);
        
        this.svg = d3.select('#'+elementID)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);
        
        this.g = this.svg.append("g");
        this.getData(mapPath, dataPath, colours);
        this.zoom = d3.zoom().on("zoom", this.zoomed.bind(this));
        this.svg.call(this.zoom);
    }

    /**
     * @param {string} mapPath - file path of the topojson file of the chosen geographical area
     * @param {string} dataPath - file path of the dataset
     * @param {string} colours - file path of the json file that defines the colours the party/candidate will be represented by on the map
     * @description to do
     */
    getData(mapPath, dataPath, colours){
        d3.queue()
            .defer(d3.json, mapPath)
            .defer(d3.csv, dataPath)
            .defer(d3.json, colours)
            .await(this.ready.bind(this))
    }
    
    /**
     * @param {string} error - file path of the topojson file of the chosen geographical area
     * @param {string} mapData - file path of the dataset
     * @param {string} electionData - file path of the json file that defines the colours the party/candidate will be represented by on the map
     * @param {string} colours - ID of the element that the svg of visualisation will be appended to
     * @description to do
     */
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

    /**
     * @description to do
     */
    draw(){
        let objectName = "FRA_adm2-1";
        this.projection.scale(1).translate([0,0]);
        let b = this.path.bounds(topojson.feature(this.mapData, this.mapData.objects[objectName]));
        let s = .95 / Math.max((b[1][0] - b[0][0])/this.width, (b[1][1] - b[0][1])/this.height);
        let t = [(this.width - s * (b[1][0] + b[0][0]))/2, (this.height - s * (b[1][1] + b[0][1]))/2];
        this.projection.scale(s).translate(t);
    
        let areas = this.g.selectAll(".area").data(topojson.feature(this.mapData, this.mapData.objects[objectName]).features);
        
        areas.enter()
            .append('path')
            .attr("class", 'area')
            .attr("fill", this.fillColour.bind(this))
            .attr("id", function(d){ return d.properties.NAME_2; })
            .attr("d", this.path)
            .on('click', this.clicked.bind(this));
    }

    /**
     * @description to do
     */
    clicked(d){
        let activeNode = d.properties.NAME_2;
        if (this.active.node() === d3.select("#"+activeNode)){
            this.resetActive();
        }
        else if(this.active.node() != null){
            this.resetActive();
        }
        
        this.active = d3.select("#"+activeNode);
        this.active.style("opacity", 0.5)
        this.active.style("stroke", "#e7e7e7");
        
        d3.select("#departement").style("visibility", "visible");
        d3.select("#result").style("visibility", "visible");

        this.displayInfo(activeNode)
        
    }

    /**
     * @description to do
     */
    displayInfo(d){        
        let partyName = '';
        let mpName = '';
        let conName= '';
    
        for (var i = 0; i < this.electionData.length; i++){
            if(this.electionData[i].departement === d){
                partyName = this.electionData[i].party;
                mpName = this.electionData[i].candidate;
                conName= this.electionData[i].departement;
            }
        }
        let result = "Won by "+partyName+" party candidate "+mpName;
        d3.select("#departement").text(conName);
        d3.select("#result").text(result);
    }

    /**
     * @param {object} d - represents the current smaller component of the map e.g. a constituency d3 script is iterating through
     * @returns hex value of the colour the constituency should be coloured with as a string<br><br>
     * @description This function iterates through names of all the constituencies in <code>map.electionData</code> checking if it matches 
     * with the constituency d3 is currently iterating through then return the colour of constituency stored in <code>map.colours</code>
     */
    fillColour(d){
        for(var i = 0; i < this.electionData.length; i++) {
            if( this.electionData[i].departement === d.properties.NAME_2 ) {
                return this.colours[this.electionData[i]['candidate']];
                }
            }
        return "#ffffff";  
    }

    /**
     * @description Handles a zoom event using <a href=https://github.com/d3/d3-zoom#transform_translate><code>d3.event.transform</code></a>
     */
    zoomed(){
        this.g.attr("transform", d3.event.transform);
    }

    /**
     * @description to do
     */
    resetActive(){
        this.active.style("opacity", 1.0);
        this.active.style("stroke", "#E7E7E7");
        this.active = d3.select(null);

        d3.select("#departement").style("visibility", "hidden");
        d3.select("#result").style("visibility", "hidden");
    }
}


function round1(){
    france = new map();
    france.removePrevious('svg');
    france.init(
        "france_2017/departements.json",
        "france_2017/round1.csv", 
        "france_2017/colours.json", "vis"
        );
}

function round2(){
    france = new map();
    france.removePrevious('svg');
    france.init(
        "france_2017/departements.json",
        "france_2017/round2.csv",
        "france_2017/colours.json", "vis"
        );
}

document.addEventListener("DOMContentLoaded", function(){
    var button1 = document.getElementById("round1");
    var button2 = document.getElementById("round2");
    button1.addEventListener("click", round1);
    button2.addEventListener("click", round2);
    });

//source https://geo.nyu.edu/catalog/stanford-fs569ct0668