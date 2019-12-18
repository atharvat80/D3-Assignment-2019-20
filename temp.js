if(this.active != null && this.active['id'] === d.properties["PC_ID"]) {
    this.active.style["opacity"] = 1.0;
    this.active.style["stroke"] = "#000";
    this.active = null;
    } 
else if (this.active != null){
        this.active.style["opacity"] = 1.0;
        this.active.style["stroke"] = "#000";
        this.active = null;
    }
else{ 
    this.active = d3.select(activeNode)._groups[0][0];
    this.active.style["opacity"] = 0.75;
    this.active.style["stroke"] = "#ffffff";
    this.displayInfo(d);
    }