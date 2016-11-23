'use strict'

var width = 960,
    height = 500;


//-------------------------------    

function init() {
    // var dsv = d3.dsvFormat(">", "text/plain");
    console.log('init');
    d3.csv("data/main.csv", function(edges) {
        console.log(edges);
        var nodes = {};

        // Compute the distinct nodes from the links.
        edges.forEach(function(link) {
            link.source = link.source.trim();
            link.target = link.target.trim();

            link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
            link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
        });

        drawForceLayoutGraph(edges, nodes);
    });
}


function drawForceLayoutGraph(edges, nodes) {
    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(edges)
        .size([width, height])
        .linkDistance(160)
        .charge(-1000)
        .on("tick", tick)
        .start();

    var svg = d3.select("#grapharea").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Per-type markers, as they don't inherit styles.
    svg.append("defs")    
        .append("marker")
        .attr("id", "arrr")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 26)
        .attr("refY", -4)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");

    var link = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class","link")
        .attr("marker-end", "url(#arrr)");

// link.append("rect").attr("width",10).attr("height",10).attr("class", "arrow");

    var node = svg.selectAll(".node")
        .data(force.nodes())
        .enter()
        .append("g")
        .attr("class", "node")
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .call(force.drag);

    node.append("rect")
        .attr("width", 130)
        .attr("height", 30)
        .attr("rx", 15)
        .attr("ry", 15);

    node.append("text")
        .attr("x", 17)
        .attr("dy", "18")
        .text(function(d) { return d.name; });

    function tick() {
        link.attr("d", linkArc);
        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")"; 
        });
    }
}

function linkArc(d) {
    var tx = d.target.x + 70;
    var ty = d.target.y + 15;
    var sx = d.source.x + 70;
    var sy = d.source.y + 15;

    var dx = tx - sx,
        dy = ty - sy,
        dr = Math.sqrt(dx * dx + dy * dy);
    return "M" + sx + "," + sy + "A" + dr + "," + dr + " 0 0,1 " + tx + "," + ty;
}



function mouseover() {
  d3.select(this).select("circle").transition()
      .duration(750)
      .attr("r", 16);
}

function mouseout() {
  d3.select(this).select("circle").transition()
      .duration(750)
      .attr("r", 14);
}