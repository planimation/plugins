// Tree Globals
var stateCounter, graph, treemap, svg, duration, treeData, treeHeight, goTree = true, heurMax = 0;
var root, d3, zoom, viewerWidth, viewerHeight;

// novelty globals
var actions, fluents, heurdata;

var UNFOLD_LIMIT = 15;
//Code review test
// novelty variables
var noveltyTable = []
var FullyDefined = 0
var listOfFacts = []
var currStatusName = ""
var currMatchedDict = {}
//  File choosing model
var HVIZ_PLANIMATION_MODEL = `
<!-- Choose Files Modal -->
<div class="modal fade" id="chooseFilesVizPlanimationModel" tabindex="-1" role="dialog" aria-labelledby="chooseFilesModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
        <h4 class="modal-title" style="display:inline" id="chooseFilesModalLabel">Planimate your plan</h4>
      </div>
      <div class="modal-body" style="display:inline-block">
        <form class="form-horizontal left" role="form">
          <div class="form-group">
            <label for="domainSelectionHvizPlanimation" class="col-sm-4 control-label">Domain</label>
            <div class="col-sm-8">
              <select id="domainSelectionHvizPlanimation" class="form-control file-selection">
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="problemSelectionHvizPlanimation" class="col-sm-4 control-label">Problem</label>
            <div class="col-sm-8">
              <select id="problemSelectionHvizPlanimation" class="form-control file-selection">
              </select>
            </div>
          </div>
           <div class="form-group">
            <label for="animateSelectionHvizPlanimation" class="col-sm-4 control-label">Animation</label>
            <div class="col-sm-8">
              <select id="animateSelectionHvizPlanimation" class="form-control file-selection">
              </select>
            </div>
          </div>
       
        </form>

        <button id="filesChosenButton" class="btn-lg btn-success" type="button" onclick="filesChosen()">Planimate</button>
    
      <br/>

    </div>
    <div class="modal-footer"  >
    <a href="http://planimation.planning.domains/" style="float:left" target="_blank">Try Planimation Web App</a>
    <button type="button" class="btn btn-default"  data-dismiss="modal">Cancel</button>
    </div>
  </div>
</div>
`
// To store the planimation object,and currently only support one planimation object
var noveltyVizPlanimation;

// Called when you click 'Planimate' on the file chooser
function loadStatespacePlanimation() {

    // Getting string versions of the selected files
    var domain = window.ace.edit($('#domainSelectionHvizPlanimation').find(':selected').val()).getSession().getValue();
    var problem = window.ace.edit($('#problemSelectionHvizPlanimation').find(':selected').val()).getSession().getValue();
    var animation = window.ace.edit($('#animateSelectionHvizPlanimation').find(':selected').val()).getSession().getValue();
    window.heuristicVizDomain = domain;
    window.heuristicVizProblem = problem;
    window.heuristicVizAnimation = animation;

    // Lowering the choose file modal menu
    $('#chooseFilesVizPlanimationModel').modal('toggle');

    // Ground the domain and problem
    ground(domain, problem).then(function (result) {
        treeData = { "name": "root", "children": [], "state": result.state, "strState": result.strState, "precondition": null, "loadedChildren": false };
        stateCounter = 1;
        launchViz();
        listOfFacts = Array.from(getGroundedFluents())
        let factsString = listOfFacts.length;
        $('#fValue').append(factsString);
        FullyDefined = getGroundedFluents().size + 1
    });

    // initialise the planimation
    initialiseHvizPlanimation(domain, problem, animation);
}

// initialise the planimation with PDDL files and add the canvas to planimation div.
function initialiseHvizPlanimation(domainPDDL, problemPDDL, animationPDDL) {
    if (document.getElementById("planimation")) {
        require(["https://cdn.jsdelivr.net/gh/planimation/Frontend-JS@46a356fde54fe01f654ee61c12c494eac5afc1c6/planimationLibrary.js"], function (Planimation) {
            noveltyVizPlanimation = new Planimation(domainPDDL, problemPDDL, animationPDDL, 325, 325);
            document.getElementById("planimation").appendChild(noveltyVizPlanimation.getView())
            // update the height of the search tree svg to 300px | not relevant now
        });
    } else {
        window.setTimeout(() => initialiseHvizPlanimation(domainPDDL, problemPDDL, animationPDDL), 5000);
    }
}


// // compare the value between noveltytable and combination
noveltyTable.customIncludes = function (entryValue) {
    return this.some(item => {
        return Object.values(item).some(valueArray =>
            Array.isArray(valueArray) &&
            valueArray.length === entryValue.length &&
            valueArray.every((val, index) => val === entryValue[index])
        );
    });
};



function areTwoListEqual(list1, list2) {
    if (list1.length != list2.length) {
        return false
    }
    var isEqual = true
    for (let i = 0; i < list1.length; i++) {
        var element1 = list1[i]
        if (!list2.includes(element1)) {
            isEqual = false
        }
    }
    return isEqual
}


function addAllCombinationToNoveltyTable(state, stateName) {
    for (let i = 0; i < state.length; i++) {
        const combination = state[i];
        if (!noveltyTable.customIncludes(combination)) {
            const entry = { [stateName]: combination };
            noveltyTable.push(entry);
        }
    }
}


//get all combinations of facts in a given state
function generateCombinationsOfState(arr) {
    let result = [];

    function _combine(curr, start) {
        if (curr.length !== 0) {
            result.push([...curr]);
        }
        for (let i = start; i < arr.length; i++) {
            curr.push(arr[i]);
            _combine(curr, i + 1);
            curr.pop();
        }
    }

    _combine([], 0);
    // console.log(" generateCombinations Current Node: " + result + result.length);
    return result.sort((a, b) => a.length - b.length);
}

// input: a list of facts, output: the length of the first non-exist comb in the table
// find the length of the the first non-exist combination in the novelty table set
function findFirstNonexistComb(state) {
    for (let i = 0; i < state.length; i++) {
        var combination = state[i]
        if (!noveltyTable.customIncludes(combination)) {
            return combination.length
        }

    }
    return FullyDefined
}


function calculateCurrMatched(state) {
    if (!currMatchedDict.hasOwnProperty(currStatusName)) {
        currMatchedDict[currStatusName] = [];
    }

    for (let i = 0; i < state.length; i++) {
        var combination = state[i];
        if (!noveltyTable.customIncludes(combination) && !currMatchedDict[currStatusName].some(existingComb => arraysAreEqual(existingComb, combination))) {
            currMatchedDict[currStatusName].push(combination);
        }
    }
}


function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}


function launchViz() {
    window.new_tab('Statespace + Planimation', function (editor_name) {
        $('#' + editor_name).html(`
    <div style="margin:13px 26px;text-align:center">
        <h3>Novelty Search Visualization And Planimation</h3>
        <div class="row">
            <div class="col-md-8">
                <div id="fValue" class="col-md-10" style="font-size:large;">|F| = </div>
                <button onclick="chooseFiles('planner')" type="button" class="btn btn-success">Plan</button>
                <div id="statespace"></div>
                <div style="float:left;">
                    <div style="display:flex;">
                        <div style="width:15px;height:15px;border-radius:50%;background-color:grey;margin-right:5px; margin-left:10px;"></div>
                         : Unexpanded node 
                        <div style="width:15px;height:15px;border-radius:50%;background-color:gold;margin-right:5px;margin-left:10px;"></div>
                         : Expanded node with novelty < |F| + 1 
                        <div style="width:15px;height:15px;border-radius:50%;background-color:red;margin-right:5px;margin-left:10px;"></div>
                         : Expanded node with novelty = |F| + 1 
                    </div>
                </div>
            </div>
            <div id="statepanel" class="col-md-4">
                <div id="statename" style="clear:both;min-height:45px;height:45px;">State<br/>(null)</div>
                <div style="height: 20px;"></div>
                <div id="planimation" style="min-height:325px;height:325px;"></div>
                <div>
                    <label>Filter by Array Length:</label>
                    <select id="arrayLengthFilter"></select>
                </div>
                <div style="padding:10px;">
                    <pre id="statedetails" style="text-align: left; overflow:auto;min-height:290px;height:330px; max-height:330px;"></pre>
                </div>
            </div>
            <div class="col-md-8">
                <label>Novelty Table</label>
                <pre id="combTableDisplay" style="text-align: left; overflow:auto;min-height:290px;height:330px; max-height:330px;"></pre>
            </div>
        </div>
        <div style="fill:black;stroke:black;stroke-width:3px;"></div>
        <p id="hv-output"></p>
    </div>
`);

        // select length
        $('#arrayLengthFilter').change(function () {
            displayArraysByLength($(this).val());
        });
    });
    makeTree();
}


function displaynoveltyTable(noveltyTable) {
    $('#combTableDisplay').empty(); // Clear the display area
    noveltyTable.forEach((item) => {
        // Extract key-value pairs from the object
        const stateName = Object.keys(item)[0]; // Get the stateName (the key)
        const combination = item[stateName]; // Get the combination (the value)
        // Create the text to be displayed for each item
        const displayText = `${stateName}: ${combination}`;
        // Append the text to the display area
        $('<p></p>').text(displayText).css(noneMatchedStyle).appendTo('#combTableDisplay');
    });
}



function displayArraysByLength(length) {
    $('#statedetails').empty();
    combinationOfState.forEach((item, index) => {
        if (length == 0 || item.length == length) {
            var matched = currMatchedDict[currStatusName] && currMatchedDict[currStatusName].some(matchedArray => arraysAreEqual(matchedArray, item));
            $("<p></p>").text(item).css(matched ? matchedStyle : noneMatchedStyle).appendTo('#statedetails');
        }
    });
}


// Special file chooser for this plugin
function chooseNoveltyvizPlanimationFiles(type) {

    window.action_type = type
    window.file_choosers[type].showChoice();

    var domain_option_list = "";
    var problem_option_list = "";
    var animate_option_list = "";
    var plan_option_list = "";
    var unknown_option_list = "";
    var hr_line = "<option disabled=\"disabled\">---------</option>\n";
    var setDom = false;
    var setProb = false;
    var setAnimate = false;
    var setPlan = false;

    for (var i = 0; i < window.pddl_files.length; i++) {
        if ($.inArray(window.pddl_files[i], window.closed_editors) == -1) {
            if (window.pddl_files[i] == window.last_domain)
                setDom = true;
            if (window.pddl_files[i] == window.last_problem)
                setProb = true;
            if (window.pddl_files[i] == window.last_animate)
                setAnimate = true;
            if (window.pddl_files[i] == window.last_plan)
                setPlan = true;

            var option = "<option value=\"" + window.pddl_files[i] + "\">" + $('#tab-' + window.pddl_files[i]).text() + "</option>\n";
            var file_text = window.ace.edit(window.pddl_files[i]).getSession().getValue();
            if (file_text.indexOf('(domain') !== -1)
                domain_option_list += option;
            else if (file_text.indexOf('(problem') !== -1)
                problem_option_list += option;
            else if (file_text.indexOf('(animation') !== -1)
                animate_option_list += option;
            else
                unknown_option_list += option;
        }
    }

    var domain_list = domain_option_list + hr_line + unknown_option_list + hr_line + problem_option_list;
    var problem_list = problem_option_list + hr_line + unknown_option_list + hr_line + domain_option_list;
    var animate_list = animate_option_list + hr_line + unknown_option_list + hr_line + animate_option_list;
    var plan_list = plan_option_list + hr_line + unknown_option_list + hr_line + plan_option_list;
    $('#domainSelectionHvizPlanimation').html(domain_list);
    $('#problemSelectionHvizPlanimation').html(problem_list);
    $('#animateSelectionHvizPlanimation').html(animate_list);
    $('#planSelectionHvizPlanimation').html(plan_list);
    if (setDom)
        $('#domainSelectionHvizPlanimation').val(window.last_domain);
    if (setProb)
        $('#problemSelectionHvizPlanimation').val(window.last_problem);
    if (setAnimate)
        $('#animateSelectionHvizPlanimation').val(window.last_animate);
    if (setPlan)
        $('#planSelectionHvizPlanimation').val(window.last_plan);
    $('#chooseFilesVizPlanimationModel').modal('toggle');
}

// Generates the SVG object, and loads the tree data into a d3 style tree
function makeTree() {
    // Prevents the creation of more than one tree
    if (goTree) {
        // Set the dimensions and margins of the diagram
        var margin = { top: 20, right: 30, bottom: 30, left: 90 };
        var width = $('#statespace').width() - margin.left - margin.right;
        var height = 700 - margin.top - margin.bottom;

        // Initialize d3 zoom
        zoom = d3.zoom().on('zoom', function () {
            svg.attr('transform', d3.event.transform);
        })

        // Declaring the SVG object, init attributes
        svg = d3.select("#statespace").append("svg")
            .attr("width", "100%")
            .attr("height", height + margin.top + margin.bottom)
            .style("background-color", "white")
            .call(zoom)
            .on("dblclick.zoom", null)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .append("g")
            .attr("transform", "translate(" + (width / 2) + "," + margin.top + ")");

        // create the tooltip
        d3.select("#statespace")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        // Num and duration of animations
        duration = 750;

        // declares a tree layout and assigns the size
        treemap = d3.tree().size([height, width]);

        // Assigns parent, children, height, depth
        root = d3.hierarchy(treeData, function (d) { return d.children; });
        root.x0 = height / 2;
        root.y0 = 0;

        // Loads children of root
        loadData(root, function (result) {
            convertNode(result);
            update(result);
            // Preventing multiple trees
            goTree = false;
        });
    }
}

// Loads children of a supplied node
function loadData(node, callback) {
    if (!node.loadedChildren) {
        const state = node.data.state;
        getChildStates(state)
            .then(data => {
                for (let i = 0; i < data['states'].length; i++) {
                    if (node.data.children) {
                        // Create data
                        const newName = "State " + stateCounter;
                        stateCounter += 1;
                        const newState = { "name": newName, "children": [], "state": data.states[i], "strState": data.stringStates[i], "precondition": data.actions[i].toString(), "loadedChildren": false };
                        node.data.children.push(newState);
                    }
                }
                node.loadedChildren = true;
                // Call the callback function with the node that contains
                // the newly loaded children
                callback(node);
            });
    }
}

// Converts the node to d3 tree form using d3.hierarchy
// and initializes other properties
function convertNode(node) {
    // Get children of node
    const allChildren = node.data.children;
    // Var to hold formatted children
    const newHierarchyChildren = [];

    allChildren.forEach((child) => {
        const newNode = d3.hierarchy(child); // create a node
        newNode.depth = node.depth + 1; // update depth depends on parent
        newNode.height = node.height;
        newNode.parent = node; // set parent
        newNode.id = String(child.id); // set uniq id

        newHierarchyChildren.push(newNode);
    });

    // Add to parent's children array and collapse
    node.children = newHierarchyChildren;
    node._children = newHierarchyChildren;
}

var matchedStyle = {
    "color": "white",
    "backgroundColor": "lightBlue",
    "padding": "5px"
}

var noneMatchedStyle = {
    "color": "grey",
    "padding": "5px"
}


var isFilterInitialized = false;

function nodeSelected(d) {
    window.current_state_node = d;
    var action_desc = '<br />' + "(null)";
    if (d.data.precondition)
        action_desc = '<br />' + infix(d.data.precondition.toLowerCase());
    $('#statename').html(d.data.name + action_desc);
    var fluents = [];
    d.data.strState.forEach(f => {
        fluents.push(infix(f).toLowerCase());
    });

    // The fact combinations of the current state
    combinationOfState = generateCombinationsOfState(fluents);
    currStatusName = d.data.name;
    calculateCurrMatched(combinationOfState);
    // console.log(currMatchedDict, currStatusName);
    // Compute the heuristic value of this node
    if ((d.data.novelty_value === undefined) || (d.data.novelty_value == '??')) {
        // graph = makeGraph(d);
        // heurdata = generateHeuristicGraphData(graph);
        d.data.novelty_value = autoUpdate(combinationOfState);
        addAllCombinationToNoveltyTable(combinationOfState, currStatusName);
        heurMax = Math.max(d.data.novelty_value, heurMax);
        update(d);
    }

    $('#statedetails').empty();

    combinationOfState.forEach((item, index) => {
        var matched = currMatchedDict[currStatusName] && currMatchedDict[currStatusName].some(matchedArray => arraysAreEqual(matchedArray, item));
        $("<p></p>").text(item).css(matched ? matchedStyle : noneMatchedStyle).appendTo('#statedetails');
    });

    displaynoveltyTable(noveltyTable);

    if (!isFilterInitialized) {
        // empty the filter
        $('#arrayLengthFilter').empty();

        // add all as default
        let allOption = new Option("All", 0, true, true);
        $('#arrayLengthFilter').append(allOption);

        // get maxlen
        let maxLen = Math.max(...combinationOfState.map(item => item.length));

        for (let i = 1; i <= maxLen; i++) {
            $('#arrayLengthFilter').append(new Option(i, i));
        }
    }
}



function autoUpdate(state) {
    return findFirstNonexistComb(state)
}

function nodeChildrenToggled(d, cb = null) {
    if (d3.event && d3.event.defaultPrevented) return;

    if (!d.loadedChildren && !d.children) {
        // Load children, expand
        loadData(d, result => {
            convertNode(d);
            d.children = d._children;
            d._children = null;
            update(d);
            if (cb)
                cb(d);
        });
    }
    else if (d.children) {
        d._children = d.children;
        d.children = null;
        update(d);
        if (cb)
            cb(d);
    } else {
        d.children = d._children;
        d._children = null;
        update(d);
        if (cb)
            cb(d);
    }
}

function infix(orig) {
    return '(' + orig.split('(')[0] + ' ' + orig.split('(')[1].split(')')[0].split(',').join(' ') + ')'
}

function normalized_check(first, second) {
    return first.replaceAll(' ', '').toLowerCase() == second.replaceAll(' ', '').toLowerCase();
}

function successor_node(src, act) {
    for (var i = 0; i < src.children.length; i++) {
        if (normalized_check(infix(src.children[i].data.precondition), act))
            return src.children[i];
    }
}

// Single click on node: update the info shown for a node
function click(d) {
    nodeSelected(d);
    // get the plan
    var plan = getNodeActions(d);

    // this variable is used to seperate root node and other node
    var nodeName = d.data.name;
    if (typeof noveltyVizPlanimation !== 'undefined') {
        noveltyVizPlanimation.updateWithPlan(plan, nodeName == "root");
    }

}

// Return a list of actions when the search tree node is clicked.
function getNodeActions(d) {

    if (d.data.name == "root") {
        return ""
    }
    return getNodeActions(d.parent) + "(" + d.data.precondition.replace(/[(),]/g, ' ').replace(/ +(?= )/g, '').trim() + ")"

}

// Double click on node: expand/collapse children
function dblclick(d) {
    nodeChildrenToggled(d);
}

// Collapses the node and all it's children
function collapse(d) {
    if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
    }
}

// Updates the tree: drawing links, nodes, and tooltip
function update(source) {
    //Assigns the x and y position for the nodes
    var treeData = treemap(root);
    // Compute the new tree layout.
    var nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
        if (d.depth > treeHeight)
            treeHeight = d.depth;
        d.y = d.depth * 130;
        if (d.data.name === "goal state") {
            while (d !== root) {
                d.path = true;
                d = d.parent;
            }
        }
    });

    // ****************** Nodes section ***************************
    var Tooltip = d3.select(".tooltip");

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function (d) {
        Tooltip
            .style("opacity", 1)
        d3.select(this)
            .style("stroke", "black")
            .style("opacity", 1);
        hoveredOverStateInStatespace(d);
    }
    var mousemove = function (d) {
        Tooltip
            .html(formatTooltip(d))
            .style("left", (d3.event.pageX - 400) + "px")
            .style("top", (d3.event.pageY - 50) + "px");
    }
    var mouseleave = function (d) {
        Tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none");
    }

    var getColor = function (d) {
        if (d.data.novelty_value < listOfFacts.length) {
            return '#FFD700'; // gold
        } else if (d.data.novelty_value > listOfFacts.length) {
            return 'red';
        }
        else
            //color of the node after clicking
            return d3.interpolateHsl('yellow', 'red')(d.data.novelty_value / heurMax);
    }


    // Update the nodes...
    var node = svg.selectAll('g.node')
        .data(nodes, function (d) { return d.data.name; })

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click)
        .on('dblclick', dblclick)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", "lightsteelblue");

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
        .attr('r', 10)
        .style("fill", getColor)
        .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = svg.selectAll('path.link')
        .data(links, function (d) { return d.data.name; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function (d) {
            var o = { x: source.x0, y: source.y0 }
            return diagonal(o, o)
        })
        .on('mousemove', function (d) {
            Tooltip
                .html(formatTooltip(d, false))
                .style("left", (d3.event.pageX - 400) + "px")
                .style("top", (d3.event.pageY - 50) + "px");
        })
        .on('mouseleave', function (d) {
            Tooltip
                .style("opacity", 0)
            d3.select(this)
                .style("stroke", "#ccc");
        })
        .on('mouseover', function (d) {
            Tooltip
                .style("opacity", 1)
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1);
        })
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-width", "2px");

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function (d) { return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
            var o = { x: source.x, y: source.y }
            return diagonal(o, o)
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Creates a curved (diagonal) path from parent to the child nodes
function diagonal(s, d) {
    path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`
    return path
}


// Returns a string of formatted html
function formatTooltip(d, node = true) {
    if (node) {
        if (d.data.novelty_value === undefined) {
            d.data.novelty_value = '??';
        }
        if (d.data.novelty_value == '??') {
            return "<div><div>Novelty = ??</div>" +
                "<div>The prediction of the state is " + infix(d.data.precondition).toLowerCase() + "</div></div>";
        } else {
            if (currMatchedDict[d.data.name] === undefined || !Array.isArray(currMatchedDict[d.data.name]) || currMatchedDict[d.data.name].length === 0) {
                return "<div><div>Novelty = " + d.data.novelty_value + "</div>" +
                    "<div>The value of Novelty is number of facts plus one </div></div>";
            } else {
                var firstValue = currMatchedDict[d.data.name][0];
                var total = infix(firstValue.join(' '));

                return "<div><div>Novelty = " + d.data.novelty_value + "</div>" +
                    "<div>The value of Novelty is calculated from " + total + "</div></div>";
            }

        }

    } else {
        // console.log(infix(d.data.precondition).toLowerCase());
        return infix(d.data.precondition).toLowerCase();
    }
}


function hoveredOverStateInStatespace(d) {
    // console.log("Hovered over state ", d, " in the state space.");
}



/*
--------------------------------------------------------------------------------
                                END OF TREE CODE
--------------------------------------------------------------------------------
*/

/*
--------------------------------------------------------------------------------
                                START OF PLUGIN INSTALLATION
--------------------------------------------------------------------------------
*/


define(function () {
    window.d3_loaded = false;
    window.hvizPlanimationSolverStyled = false;
    return {
        name: "Novelty Visualization",
        author: "Ruochan Wang",
        email: "wrc9817@gmail.com",
        description: "Novelty Visualization",

        initialize: function () {

            if ("heuristic-viz" in window.plugins) {
                window.toastr.warning("This plugin can not be loaded with Heuristic Vizualization synchronized! Please reload this page and loading the Novelty Viz separately! ")
            } else {
                var style = document.createElement('tree');
                style.innerHTML = '.node { cursor:pointer } .node circle { stroke-width:1.5px } .node text { font:10px sans-serif }' +
                    'div.tooltip {position:absolute; padding:6px; font:12px sans-serif; background-color:#FFA; border-radius:8px; pointer-events:none; left:0; top:0}';
                var ref = document.querySelector('script');
                ref.parentNode.insertBefore(style, ref);

                // Init grounding
                initializeGrounding();

                // Adds menu button that allows for choosing files
                window.add_menu_button('NoveltyVizPlanimation', 'noveltyVizPlanimationMenuItem', 'glyphicon-glass', "chooseNoveltyvizPlanimationFiles('NoveltyVizPlanimation')");
                window.inject_styles('.viz_display {padding: 20px 0px 0px 40px;}')

                // Register this as a user of the file chooser interface
                window.register_file_chooser('NoveltyVizPlanimation',
                    {
                        showChoice: function () {
                            // Button name, Description
                            window.setup_file_chooser('Go', 'Display Visualization');
                            $('#plannerURLInput').hide();
                        },
                        // Called when go is hit
                        selectChoice: loadStatespacePlanimation
                    });
                if (!(window.hvizPlanimationSolverStyled)) {
                    $('body').append(HVIZ_PLANIMATION_MODEL);
                    window.hvizPlanimationSolverStyled = true;
                }
            }


        },

        disable: function () {
            // This is called whenever the plugin is disabled
            window.toastr.warning("Plugin disabled")
            window.remove_menu_button("noveltyVizPlanimationMenuItem");
        },

        save: function () {
            // Used to save the plugin settings for later
            return { did: window.viz_dom_id };
        },

        load: function (settings) {
            // Restore the plugin settings from a previous save call
            window.viz_dom_id = settings['did'];
        }
    };
});

