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
var hvizPlanimation;

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

    launchHvizPlanimation();
  });

  // initialise the planimation
  initialiseHvizPlanimation(domain, problem, animation);
}

// initialise the planimation with PDDL files and add the canvas to planimation div.
function initialiseHvizPlanimation(domainPDDL, problemPDDL, animationPDDL) {
  if (document.getElementById("planimation")) {
    require(["https://cdn.jsdelivr.net/gh/planimation/Frontend-JS@46a356fde54fe01f654ee61c12c494eac5afc1c6/planimationLibrary.js"], function (Planimation) {
      hvizPlanimation = new Planimation(domainPDDL, problemPDDL, animationPDDL, 350, 350);
      document.getElementById("planimation").appendChild(hvizPlanimation.getView())
      // update the height of the search tree svg to 300px | not relevant now
      // document.getElementById("statespace").getElementsByTagName("svg")[0].style.height = "300px";
    });
  } else {
    window.setTimeout(() => initialiseHvizPlanimation(domainPDDL, problemPDDL, animationPDDL), 5000);
  }
}

//The following is copied from Hviz plugin and addtional planimation div is added.
function launchHvizPlanimation() {
  window.new_tab('Statespace + Planimation', function (editor_name) {
    $('#' + editor_name).html('<div style = "margin:13px 26px;text-align:center"><h3>Heuristic Search Vizualization</h3>' +

      '<div class="row">' +
      '  <div class="col-md-8">' +
      '     <div id="statespace"></div>' +
      '  </div>' +
      '  <div id="statepanel" class="col-md-4">' +
      '    <div id="statebuttons" style="padding:10px">' +
      '      <button onclick="show_hadd()" type="button" class="btn btn-info">hadd</button>' +
      '      <button onclick="compute_plan()" type="button" class="btn btn-success">Plan</button>' +
      '      <button style="margin-left:30px" onclick="compute_all_heur()" type="button" class="btn btn-primary">Compute All Heuristics</button>' +
      '    </div>' +
      '    <div id="statename" style="clear:both">State</div>' +
      '    <div id="planimation"></div>' +
      '    <div id="statedetails" style="padding:10px"></div>' +
      '  </div>' +
      '</div>' +

      '</div>' +
      '<node circle style ="fill:black;stroke:black;stroke-width:3px;></node circle>' +
      '<p id="hv-output"></p>');
  });
  makeTree();

}


// Single click on node: update the info shown for a node
function clickHvizPlanimation(d) {
  nodeSelected(d);

  // get the plan
  var plan = getNodeActions(d);

  // this variable is used to seperate root node and other node
  var nodeName = d.data.name;
  if (typeof hvizPlanimation !== 'undefined') {
    hvizPlanimation.updateWithPlan(plan, nodeName == "root");
  }
}

// Return a list of actions when the search tree node is clicked.
function getNodeActions(d) {

  if (d.data.name == "root") {
    return ""
  }
  return getNodeActions(d.parent) + "(" + d.data.precondition.replace(/[(),]/g, ' ').replace(/ +(?= )/g, '').trim() + ")"

}

// Special file chooser for this plugin
function chooseHvizPlanimationFiles(type) {

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



// If heuristic-viz is loaded, then add heuristic-viz with Planimation plugin
// If the heuristic-viz is not loaded, plugin will load failed.


define(function () {
  window.hvizPlanimationSolverStyled = false;

  return {
    name: "Heuristic Viz with Planimation",
    author: "Nir Lipovetzky, Yi Ding",
    email: "nir.lipovetzky@unimelb.edu.au",
    description: "Heuristic Vizualization with Planimation",
    initialize: function () {

      if ("heuristic-viz" in window.plugins) {
        // Adds menu button that allows for choosing files
        window.remove_menu_button("heurVizMenuItem");

        window.add_menu_button('HvizPlanimation', 'hvizPlanimationMenuItem', 'glyphicon-tower', "chooseHvizPlanimationFiles('HvizPlanimation')");
        window.inject_styles('.viz_display {padding: 20px 0px 0px 40px;}')

        // Register this as a user of the file chooser interface
        window.register_file_chooser('HvizPlanimation',
          {
            showChoice: function () {
              // Button name, Description
              window.setup_file_chooser('Go', 'Display Visualization');

            },
            // Called when go is hit
            selectChoice: loadStatespacePlanimation
          });

        // replace the original click function in Hviz plugin
        click = clickHvizPlanimation;

      } else {
        console.log("initialize once!!!!")
        window.toastr.warning("Please enable the Heuris first, then enable this plugin")
        disableIfHvizNotLoad()

      }

      if (!(window.hvizPlanimationSolverStyled)) {
        $('body').append(HVIZ_PLANIMATION_MODEL);
        window.hvizPlanimationSolverStyled = true;
      }
    },

    disable: function () {
      // This is called whenever the plugin is disabled
      window.toastr.warning("Plug in disabled")
      window.remove_menu_button("hvizPlanimationMenuItem");
    },

    save: function () {
      // Used to save the plugin settings for later
      window.toastr.warning("Plug in saved")
    },

    load: function (settings) {
      // Restore the plugin settings from a previous save call
      window.toastr.warning("Plug in loaded")
    }
  };

});

// call this function every 1 seconds, until the plugin is disabled.
function disableIfHvizNotLoad() {
  if ("heuristic-viz-with-planimation" in window.plugins && window.plugins["heuristic-viz-with-planimation"].enabled == true) {
    // disable the plugin
    $("#plugin_entry__heuristic-viz-with-planimation input").click()
    window.plugins["heuristic-viz-with-planimation"].enabled = false;
  } else {
    window.setTimeout(disableIfHvizNotLoad, 1000);
  }

}
