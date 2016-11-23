'use strict'

var width = 1000,
    height = 900;


//-------------------------------    

function init() {
    // var dsv = d3.dsvFormat(">", "text/plain");
    console.log('init');
    d3.csv("data/main.csv", function(edges) {
        console.log(edges);
        var nodes = [];

        // Compute the distinct nodes from the links.
        edges.forEach(function(link) {
            link.source = link.source.trim();
            link.target = link.target.trim();

            link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
            link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
        });
        
        drawRadial(edges, nodes);
    });
}


function drawForceLayoutGraph(edges, nodes) {
    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(edges)
        .size([width, height])
        .linkDistance(200)
        .charge(-1000)
        .on("tick", tick)
        .start();

    var svg = d3.select("#grapharea").append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    // Per-type markers, as they don't inherit styles.
    svg.append("defs")    
        .append("marker")
        .attr("id", "arrr")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");
    
    svg.append("defs").selectAll("marker")
        .data(["suit", "licensing", "resolved"])
        .enter()
        .append("marker")
        .attr("id", function(d) { return d; })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
        .style("stroke", "#4679BD")
        .style("opacity", "0.6");

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

    var link = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class","link")
        .attr("marker-end", "url(#arrr)");

// link.append("rect").attr("width",10).attr("height",10).attr("class", "arrow");



    function tick() {
        link.attr("d", linkArc);
        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")"; 
        });
        node.each(collide(0.5, nodes)); 
    }
}

function linkArc(d) {
    var tx = d.target.x + ((d.target.x - d.source.x > 0) ? 10 : 75);
    var ty = d.target.y + ((d.target.y - d.source.y > 0) ? 0 : 30);
    var sx = d.source.x + 75;
    var sy = d.source.y + ((d.target.y - d.source.y > 0) ? 30 : 0);

    var dx = tx - sx,
        dy = ty - sy,
        dr = Math.sqrt(dx * dx + dy * dy)*2;

    var qx = Math.sign(dx) * 10,
        qy = Math.sign(dy) * 50;
    // return "M" + sx + "," + sy + "A" + dr + "," + dr + " 0 0,1 " + tx + "," + ty;
    return "M" + sx + "," + sy + "q" + qx + "," + qy + " , " + dx + "," + dy;
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


function collide(alpha, nodes) {
    var padding = 20, // separation between circles
    radius=30;
  var quadtree = d3.geom.quadtree(nodes);
  return function(d) {
    var rb = 2*radius + padding,
        nx1 = d.x - rb,
        nx2 = d.x + rb,
        ny1 = d.y - rb,
        ny2 = d.y + rb;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y);
          if (l < rb) {
          l = (l - rb) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}
//---------------------------------------------------------------


function drawRadial(edges, nodes) {
    var diameter = 960,
    radius = diameter / 2,
    innerRadius = radius - 120;

var cluster = d3.layout.cluster()
    .size([360, innerRadius])
    .sort(null)
    .value(function(d) { return 20; });

var bundle = d3.layout.bundle();

var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(.85)
    .radius(function(d) { return d.y; })
    .angle(function(d) { return d.x / 180 * Math.PI; });

var svg = d3.select("#grapharea").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
  .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

var link = svg.append("g").selectAll(".link"),
    node = svg.append("g").selectAll(".node");


  link = link
      .data((edges))
      .enter()
      .append("path")
      //.each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
      .attr("class", "link")
      .attr("d", line);

    var nodesc = cluster.nodes(createHierarchy(nodes));

  node = node
      .data(nodesc)
    .enter().append("text")
      .attr("class", "node")
      .attr("dy", ".31em")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
      .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .text(function(d) { console.log(d);return d.key; })
      .on("mouseover", mouseovered)
      .on("mouseout", mouseouted);

function mouseovered(d) {
  node
      .each(function(n) { n.target = n.source = false; });

  link
      .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
      .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
    .filter(function(l) { return l.target === d || l.source === d; })
      .each(function() { this.parentNode.appendChild(this); });

  node
      .classed("node--target", function(n) { return n.target; })
      .classed("node--source", function(n) { return n.source; });
}

function mouseouted(d) {
  link
      .classed("link--target", false)
      .classed("link--source", false);

  node
      .classed("node--target", false)
      .classed("node--source", false);
}

    function createHierarchy(data) {
        var root = {
            parent: [],
            key: "Omid",
            name: "Omid",
            depth: 0,
            children: []
        };
        data.map(function(node){
            var n = {
                parent: root,
                key: node.name,
                name: node.name,
                depth: 1,
                children: []
            };
            root.children.push(n);
        }); 
        data.push(root);
        return data;
    }
}


//---------------------------------------------------------------
function drawSimpleGraph(edges, nodes) {
    console.log(nodes);
    var svg = d3.select("#grapharea").append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var drag = d3.behavior.drag()
                .on("drag", function(d, i) {
                    d.x += d3.event.dx
                    d.y += d3.event.dy
                    d3.select(this).attr("cx", d.x).attr("cy", d.y);
                    links.each(function(l, li) {
                    if (l.source == i) {
                        d3.select(this).attr("x1", d.x).attr("y1", d.y);
                    } else if (l.target == i) {
                        d3.select(this).attr("x2", d.x).attr("y2", d.y);
                    }
                    });
                });

 var links = svg.selectAll("link")
   .data(edges)
   .enter()
   .append("line")
   .attr("class", "link")
   .attr("x1", function(l) {
     var sourceNode = nodes.filter(function(d, i) {
       return i == l.source;
     })[0];
     d3.select(this).attr("y1", sourceNode.y);
     return sourceNode.x;
   })
   .attr("x2", function(l) {
     var targetNode = nodes.filter(function(d, i) {
       return i == l.target;
     })[0];
     d3.select(this).attr("y2", targetNode.y);
     return targetNode.x;
   })
   .attr("fill", "none")
   .attr("stroke", "white");

 var nodes = svg.selectAll("node")
   .data(nodes)
   .enter()
   .append("circle")
   .attr("class", "node")
   .attr("cx", function(d) {
     return d.x
   })
   .attr("cy", function(d) {
     return d.y
   })
   .attr("r", 15)
   .attr("fill", function(d, i) {
     return c10(i);
   })
   .call(drag);
}