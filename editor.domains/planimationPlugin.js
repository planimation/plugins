var PLANIMATION_HELP_MODEL=`
<div class="modal fade in" id="planimationhelpModal" tabindex="-1" role="dialog" aria-labelledby="helpModalLabel" aria-hidden="false" style="display: none;">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button>
        <h4 class="modal-title" id="helpModalLabel">Planimation Help and Information</h4>
      </div>
      <div class="modal-body">
        <p><strong>Planimation</strong> is a web application that animates plans given by a <a href="http://en.wikipedia.org/wiki/Planning_Domain_Definition_Language" target="_blank">PDDL</a> planner.

        Currently it supports the following features:</p>

        <ul>
          <li>Animate the plan return by the solver API: http://solver.planning.domains/solver</li>
          <li>Animate the uploaded plan</li>
          <li>Download/upload the animation data</li>
        </ul>
		<hr class="style1">
    <strong>Contribute to Planimation</strong>
        <p>Planimation is a modular and extensible open source framework to visualise sequential solutions of planning problems specified in PDDL. It introduces a preliminary declarative PDDL-like animation profile specification, expressive
enough to synthesise animations of arbitrary initial states and goals of a benchmark with just a single profile. </p>
        
      <p>Planimation intends to help users to better understand AI planning, and its solutions. It's an open source project, So please contribute! You can find all the source code and documention at [<a href="https://github.com/planimation" target="_blank">here</a>]

        </p>
        <p>Any feedback, bug reports, comments, questions, or concerns can be sent to <a target="_blank" href="mailto:nir.lipovetzky@unimelb.edu.au">Nir Lipovetzky</a>, or through one of the issues tracker in the code repos at [<a href="https://github.com/planimation" target="_blank">github.com/planimation</a>].
        </p>

      </div>
      <div class="modal-footer">
      	
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>

`
var PLANIMATION_MODEL =`
<!-- Choose Files Modal -->
<div class="modal fade" id="chooseFilesPlanimationModel" tabindex="-1" role="dialog" aria-labelledby="chooseFilesModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
        <h4 class="modal-title" style="display:inline" id="chooseFilesModalLabel">Planimate your plan</h4>
        <a onclick="$('#planimationhelpModal').modal(true)"><span class="glyphicon glyphicon-question-sign" style="cursor: pointer; top:7px !important; left:7px;font-size:25px;"aria-hidden="true"></span></a>
    
      </div>
      <div class="modal-body">
        <form class="form-horizontal left" role="form">
          <div class="form-group">
            <label for="domainPlanimationSelection" class="col-sm-4 control-label">Domain</label>
            <div class="col-sm-8">
              <select id="domainPlanimationSelection" class="form-control file-selection">
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="problemPlanimationSelection" class="col-sm-4 control-label">Problem</label>
            <div class="col-sm-8">
              <select id="problemPlanimationSelection" class="form-control file-selection">
              </select>
            </div>
          </div>
           <div class="form-group">
            <label for="animateSelection" class="col-sm-4 control-label">Animation</label>
            <div class="col-sm-8">
              <select id="animateSelection" class="form-control file-selection">
              </select>
            </div>
          </div>
       
        </form>

        <button id="filesChosenButton" class="btn-lg btn-success" type="button" onclick="filesChosen()">Planimate</button>
    


        <div class="form-group" style="display:inline-block">
            

         

        <div id="plannerURLInput" class="input-group">
          <input type="radio" id="urlradio" name="planradio"  onchange="on_change(this)" checked style="display:flex;position:relative;top:-10px;margin-left:15px;margin-right:-10px;">
          <span class="input-group-addon" id="customPlannerLabel">Custom Planner URL</span>
          <input id="plannerPlanimationURL" type="text" class="form-control" aria-describedby="customPlannerLabel" placeholder="http://solver.planning.domains/solve">
        </div>

<br/>
            <div class="col-sm-4" style="margin-bottom:5px;">
            <input type="radio" id="planradio" name="planradio" onchange="on_change(this)" style="margin-right:10px">
            <label>Upload Plan</label>
            </div>

            <div class="col-sm-4" style="position:relative;top:-5px;left:-6px;">
              <select id="planSelection" style="display:none" class="form-control file-selection">
              </select>
            </div>
          
      </div>
      <br/>

      <div class="modal-footer"  >
        <a href="http://planimation.planning.domains/" style="float:left" target="_blank">Try Planimation Web App</a>
        <button type="button" class="btn btn-default"  data-dismiss="modal">Cancel</button>
      </div>
    </div>
  </div>
</div>
`


// global id and counter to maintain multiple iframes
var iframe_id = ''
var iframe_counter = 0

// function to load files into independent iframe
function loadFileUnity(){
          var planimation_iframe=document.getElementById(iframe_id.toString());
          var domText = window.ace.edit($('#domainPlanimationSelection').find(':selected').val()).getSession().getValue();
          var probText = window.ace.edit($('#problemPlanimationSelection').find(':selected').val()).getSession().getValue();
          var animateText = window.ace.edit($('#animateSelection').find(':selected').val()).getSession().getValue();
          var planSelected=document.getElementById("planradio").checked;
          if (planSelected){
          var planText = window.ace.edit($('#planSelection').find(':selected').val()).getSession().getValue();
          if (planText.length<2){
            planText=" "
          }
          }else{
            planText=" ";
          }
          var message={"domText":domText,"probText":probText,"animateText":animateText,"planText":planText,"solverURL": window.planimationURL};

          planimation_iframe.contentWindow.postMessage(message,"*");
          window.toastr.success("Start Planimation!");
      }

// function to run animation of resultant output in iframe
function runPlanimation() {
    window.planimationURL = $('#plannerPlanimationURL').val();
    if (window.planimationURL.slice(-1) === "/")
        window.planimationURL = window.planimationURL.slice(0, window.planimationURL.length-1);
    $('#chooseFilesPlanimationModel').modal('toggle');
    showPlanimation();

}

// run over all process and communicate with external process to generate plan
function showPlanimation() {
	iframe_counter= iframe_counter+1;
    var tab_name='<span class="glyphicon glyphicon-film" aria-hidden="true"></span> Planimation';

    window.new_tab(tab_name, function(editor_name) {
        var html = '';
		iframe_id += 'planimation_iframe'+iframe_counter.toString();
        html +='<html lang="en-us"> <head> <meta charset="utf-8"> <title>Planning Visualiser</title> <style> @media screen and (max-width: 1399px) {#';
		html +=iframe_id;
		html +='{ width:100%; height:640px;}} @media screen and (min-width: 1400px) {#';
		html +=iframe_id;
		html +='{ width:1200px;height:640px; }} </style> ';
		html +='<script type="text/javascript">';
		html +=' </script> </head> <body> <iframe scrolling="no" style="overflow:hidden" id=';
		html +='"'+iframe_id+'"'
		html +=' src="https://planning-visualisation.herokuapp.com/index.html"></iframe> </body></html>';		
        $('#' + editor_name).html(html);
        window.toastr.success('Planimation Window Created!');
        window.toastr.success('First time loading unity (wait 10s)');
    });

    return;

}
function choosePlanimationFiles(type) {

    window.action_type = type
    window.file_choosers[type].showChoice();

    var domain_option_list = "";
    var problem_option_list = "";
    var animate_option_list = "";
    var plan_option_list="";
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

    var domain_list = domain_option_list+hr_line+unknown_option_list+hr_line+problem_option_list;
    var problem_list = problem_option_list+hr_line+unknown_option_list+hr_line+domain_option_list;
    var animate_list = animate_option_list+hr_line+unknown_option_list+hr_line+animate_option_list;
    var plan_list = plan_option_list+hr_line+unknown_option_list+hr_line+plan_option_list;
    $('#domainPlanimationSelection').html(domain_list);
    $('#problemPlanimationSelection').html(problem_list);
    $('#animateSelection').html(animate_list);
    $('#planSelection').html(plan_list);
    if (setDom)
        $('#domainPlanimationSelection').val(window.last_domain);
    if (setProb)
        $('#problemPlanimationSelection').val(window.last_problem);
    if (setAnimate)
        $('#animateSelection').val(window.last_animate);
    if (setPlan)
        $('#planSelection').val(window.last_plan);
    $('#chooseFilesPlanimationModel').modal('toggle');
}



function on_change(event){
      if (event.id=="planradio"){
       $('#planSelection').show();
}else{
 $('#planSelection').hide();
}
    
}

define(function () {

    // Use this as the default solver url
    window.planimationURL = "http://solver.planning.domains/solve";

      // Use a flag to only insert styles once
    window.planimationSolverStyled = false;

    return {

        name: "Planimation",
        author: "Nir Lipovetzky (plugin)",
        email: "nir.lipovetzky@unimelb.edu.au",
        description: "Solver to Animate PDDL Plans.",

        initialize: function() {
            // This will be called whenever the plugin is loaded or enabled

            // add menu item on the top menu
            window.add_menu_button('Planimation', 'planimationMenuItem', 'glyphicon-film', "choosePlanimationFiles('planimation')");
            window.register_file_chooser('planimation',
            {
                showChoice: function() {

                    window.action_type = 'planimation'
                    $('#plannerPlanimationURL').val(window.planimationURL);
                },
                selectChoice: runPlanimation
            });

            if (!(window.planimationSolverStyled)) {
                $('body').append(PLANIMATION_MODEL);
                $('body').append(PLANIMATION_HELP_MODEL);
                
                window.planimationSolverStyled = true;
            }
            
            //Send file to Planimation Unity window when unity load properly
            window.addEventListener("message", function(event) { 
             
                        if (event.origin!= "http://editor.planning.domains"){
                            if (event.data.action==="loadfile"){loadFileUnity()}
                        }
                        }, false);

        },

        disable: function() {
            // This is called whenever the plugin is disabled
            window.remove_menu_button('planimationMenuItem');
        },

        save: function() {
            // Used to save the plugin settings for later
            return {planimationURL: window.planimationURL};
        },

        load: function(settings) {
            // Restore the plugin settings from a previous save call
            window.planimationURL = settings['planimationURL'];
        }

    };
});