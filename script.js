/**
 * @fileOverview This module is intended to create an interactive map to visualise election results of the chosen geographical area
 * @tutorial <a href="tutorial.html"> How to use this script</a>
 * @license MIT Lisence v2
 */

/**
 * Class that serves as a template for the visualisation. It contains all the attributes and methods required for the visualisation. 
 * Please see the <a href="tutorial.html">tutorial</a> on how to create a visualisation for more support
*/
class map{
    /**Defines the attributes of class map
     * @property {Object} this.mapData - Stores the data of the TopoJSON file of the chosen geographical area parsed by d3.json() 
     * @property {array} this.electionData - Stores the data of the chosen election's csv file parsed by d3.csv()
     * @property {number} this.width - Width of the svg element of the map
     * @property {number} this.height - Height of the svg element of the map
     * @property {function} this.projection - Defines which <a href="https://github.com/d3/d3-geo-projection">d3 projection</a> to use 
     * @property {Object} this.active - Stores the area that has been clicked on by the user
     * @property {Object} this.svg - Stores the svg element to be appended to an element of the specified ID of the page
     * @property {Object} this.g - Stores individual svg path elements of the constituencies as one element to form the svg of the country 
     * @property {function} this.path - Stores a set of functions that convert point data in the TopoJSON file path elements using <a href="https://github.com/d3/d3-geo#path_projection">d3-geo projection</a>
     * @property {function} this.zoom - handles an event when user tries to zoom
     * @property {Object} this.colours - Stores the colours used to represent candidate/party on the map 
     * @property {string} this.name1 - Stores the name of the attribute that  in "objects" attribute of the TopoJSON file 
     * @property {string} this.name2 - Stores the name of the attribute that stores the name of the constituency in "properties" attribute of the TopoJSON file 
     * @property {string} this.constituency - Stores the name of the column that contains the constituencies 
     * @property {string} this.candidate - Stores the name of the column that contains the candidates
     * @property {string} this.party - Stores the name of the column that contains the party names
     * @property {number} this.scale - Defines the scale of the visualisation when it's rendered (0.98 by default)
     */
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
     * @description Performs following actions:
     * <ul>
     * <li>Assigns the arguments to map's attributes</li>
     * <li>Sets width, height of the visualisation to that of the element it will be appended to </li>
     * <li>Appends a svg and g element to the selected element</li>
     * <li>Calls <code>map.getData</code> to parse data from input files</li>
     * <li>Calls <code>map.zoom</code> to handle a zoom event</li>
     * </ul>
     */
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

    /**
     * @param {string} mapPath - file path of the topojson file of the chosen geographical area
     * @param {string} dataPath - file path of the dataset
     * @param {string} colours - file path of the json file that defines the colours the party/candidate will be represented by on the map
     * @description parses the data of the file located in the provided locations and calls the <code>map.ready</code> once done.
     */
    getData(mapPath, dataPath, colours){
        d3.queue()
            .defer(d3.json, mapPath)
            .defer(d3.csv, dataPath)
            .defer(d3.json, colours)
            .await(this.ready.bind(this))
    }
    
    /**
     * @param {string} error - file path of the TopoJSON file of the chosen geographical area
     * @param {string} mapData - file path of the dataset
     * @param {string} electionData - file path of the json file that defines the colours the party/candidate will be represented by on the map
     * @param {string} colours - ID of the element that the svg of visualisation will be appended to
     * @description Returns the error occurred while parsing the input files or initiates the visualisation
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
     * @description Displays the visualisation
     */
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

    /**
     * @param {Object} d - path element that has been clicked on represent as an object
     * @description Gets the <code>id</code> of <code>d</code> and edits HTML DOM style properties to highlight that path element and
     * display information about that constituency. If the same path has been clicked on twice the path style is set back to default
     * and the information is hidden.
     */
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

    /**
     * @description Performs following actions on <code>this.active</code>:
     * <ul>
     *  <li> Sets the styling back to default</li>
     *  <li> Sets this.active to null again as the current path is no longer active<\li>
     * </ul>
     */
    resetActive(){
        this.active.style.opacity  = 1.0;
        this.active.style.strokeWidth = '0.5px';
        this.active = null;
    }

    /**
     * @param {string} d - Name of the constituency that has been clicked on
     * @description Displays the results of the selected constituency using <code>d3.select()</code>
     */
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

    /**
     * @param {object} d - represents the current smaller component of the map e.g. a constituency d3 script is iterating through
     * @description This function iterates through names of all the constituencies in <code>map.electionData</code> checking if it matches 
     * with the constituency d3 is currently iterating through then return the colour of constituency stored in <code>map.colours</code>
     * @returns hex value of the colour the constituency should be coloured with as a string. "#ffffff" is returned by default if 
     * a colour code for the current constituency can't be found<br><br>
     */
    fillColour(d){
        for(var i = 0; i < this.electionData.length; i++) {
            if( this.electionData[i][this.constituency] === d.properties[this.name2] ) {
                return this.colours[this.electionData[i][this.party]];
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
}