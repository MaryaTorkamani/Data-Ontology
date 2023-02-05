var elems = {
  nodes: [
    { data: { id: 'Start' } },
    { data: { id: '1' } },
    { data: { id: '2' } },
    { data: { id: '3' } },
    { data: { id: '4' } },
    { data: { id: '1A' } },
    { data: { id: '1B' } },
    { data: { id: '1C' } },
    { data: { id: '2A' } },
    { data: { id: '2B' } },
    { data: { id: '2C' } },
    { data: { id: '3A' } },
    { data: { id: '3B' } },
    { data: { id: '3C' } },
    { data: { id: '4A' } },
    { data: { id: '4B' } },
    { data: { id: '4C' } }
  ],
  edges: [
    { data: { source: 'Start', target: '1' } },
    { data: { source: 'Start', target: '2' } },
    { data: { source: 'Start', target: '3' } },
    { data: { source: 'Start', target: '4' } },
    { data: { source: '1', target: '1A' } },
    { data: { source: '1', target: '1B' } },
    { data: { source: '1', target: '1C' } },
    { data: { source: '2', target: '2A' } },
    { data: { source: '2', target: '2B' } },
    { data: { source: '2', target: '2C' } },
    { data: { source: '3', target: '3A' } },
    { data: { source: '3', target: '3B' } },
    { data: { source: '3', target: '3C' } },
    { data: { source: '4', target: '4A' } },
    { data: { source: '4', target: '4B' } },
    { data: { source: '4', target: '4C' } },
  ]
};

var childrenData = new Map(); //holds nodes' children info for restoration

var cy = cytoscape({
  container: document.getElementById('cy'),
  autounselectify: true,
  style: [
    {"selector":"core","style":
      {"selection-box-color":"#AAD8FF","selection-box-border-color":"#8BB0D0","selection-box-opacity":"0.5"}
    },
    {"selector":"node","style":
      {"width":"118px","height":"100px","content":"data(id)","font-size":"24px","text-valign":"center","text-halign":"center","background-color":"#555","text-outline-color":"#555","text-outline-width":"2px","color":"#fff","overlay-padding":"6px","z-index":"10"}
    },
    {"selector":"node[?attr]","style":
      {"shape":"rectangle","background-color":"#aaa","text-outline-color":"#aaa","width":"16px","height":"16px","font-size":"6px","z-index":"1"}
    },
    {"selector":"node:selected","style":
      {"border-width":"6px","border-color":"#AAD8FF","border-opacity":"0.5","background-color":"#77828C","text-outline-color":"#77828C"}
    },
    {"selector":"edge","style":
      {"curve-style":"haystack","haystack-radius":"0","opacity":"0.4","line-color":"#bbb","width": "10px","overlay-padding":"3px"}
    }
  ],
  elements: elems,
  layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 10
  }
});


//populating childrenData
var nodes = elems.nodes
for(var x = 0; x < nodes.length; x++){
  var curNode = cy.$("#" + nodes[x].data.id);
  var id = curNode.data('id');
  //get its connectedEdges and connectedNodes
  var connectedEdges = curNode.connectedEdges(function(){
      //filter on connectedEdges
      return !curNode.target().anySame( curNode );
  });
  var connectedNodes = connectedEdges.targets();
  //and store that in childrenData
  //removed is true because all children are removed at the start of the graph
  childrenData.set(id, {data:connectedNodes.union(connectedEdges), removed: true}); 
} 
//recursively removing all children of the Start node (all nodes but the Start node will be removed)
recursivelyRemove(nodes[0].data.id, cy.$("#" + nodes[0].data.id));
//replacing just the first level nodes
childrenData.get(nodes[0].data.id).data.restore();
childrenData.get(nodes[0].data.id).removed = false;

//removes and restores nodes' children on click
cy.on('tap', 'node', function(){
  var nodes = this;
  var id = nodes.data('id')
  //if the node's children have been removed
  if (childrenData.get(id).removed == true){
    //restore the nodes and edges stored there
    childrenData.get(id).data.restore();
    //set removed to false
    childrenData.get(id).removed = false;
  } else {
    //removed the children nodes and edges recursively
    recursivelyRemove(id,nodes);
  }
});

//recursively removes all children of the given node
function recursivelyRemove(id,nodes){
  //nodes is the starting node where the recursion starts
  var toRemove = [];
  //for loop that runs forever until a break or return, similiar to while true loop
  for(;;){
    //setting removed to true for every node (every child, recursively down)
    nodes.forEach(function(node){
      childrenData.get(node.data('id')).removed = true;
    });

    var connectedEdges = nodes.connectedEdges(function(el){
      //getting connectedEdges from all the nodes that only go down the tree 
      //aka not keeping edges where their target is a node in the current group of nodes
      return !el.target().anySame( nodes );
    });
        
    var connectedNodes = connectedEdges.targets();
    //pushing the nodes at the end of those edges (targets) onto toRemove array
    Array.prototype.push.apply( toRemove, connectedNodes );
    //new set of nodes for next iteration is connectedNodes
    nodes = connectedNodes;

    //breaks out of loop if nodes is empty, meaning the last set of nodes had no further children
    if( nodes.empty() ){ break; }
    //otherwise loops again, using the newly collected connectedNodes
  }
  for( var i = toRemove.length - 1; i >= 0; i-- ){ 
    //removing those nodes (and associated edges)
    toRemove[i].remove();
  } 
}

cy.on('mouseover', 'node', function(event) {
    var node = event.cyTarget;
    node.qtip({
         content: 'hello',
         show: {
            event: event.type,
            ready: true
         },
         hide: {
            event: 'mouseout unfocus'
         }
    }, event);
});

