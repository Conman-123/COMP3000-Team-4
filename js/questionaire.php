<?php
	function getId($name) {
		$id = explode("-", $name)[1];

		return $id;
	}

	$questions = array(
		"During the last 30 days, about how often did you feel tired out for no good reason?",
		"During the last 30 days, about how often did you feel nervous?",
		"During the last 30 days, about how often did you feel so nervous that nothing could calm you down?",
		"During the last 30 days, about how often did you feel hopeless?",
		"During the last 30 days, about how often did you feel restless or fidgety?",
		"During the last 30 days, about how often did you feel so restless you could not sit still?",
		"During the last 30 days, about how often did you feel depressed?",
		"During the last 30 days, about how often did you feel that everything was an effort?",
		"During the last 30 days, about how often did you feel so sad that nothing could cheer you up?",
		"During the last 30 days, about how often did you feel worthless?"
	);

	$rest_json = file_get_contents("php://input");
	$_POST = json_decode($rest_json, true);

	for ($i = 0; $i < 9; $i++) {
		$id = getId($_POST[$i]["name"]);
		$answer = '
		{
			"linkId": "'. $id. '",
			"text": "'. $questions[$i] .'",
			"answer": [
				{
					"valueCoding": {
						"system": "http://loinc.org",
						"code": "'. $_POST[$i]["value"] .'"
					}
				}
			]
		},';

		$results .= $answer;
	}

	$id = getId($_POST[9]["name"]);
	$answer = '
		{
			"linkId": "'. $id. '",
			"text": "'. $questions[$i] .'",
			"answer": [
				{
					"valueCoding": {
						"system": "http://loinc.org",
						"code": "'. $_POST[$i]["value"] .'"
					}
				}
			]
		}';

	$results .= $answer;

	$data = '{
	"resourceType" : "QuestionnaireResponse",
	"questionnaire" : "http://hl7.org/fhir/Questionnaire/K10_kessler_psychological_distress_scale",
	"status" : "completed",
	"subject" : { 
		"reference": "http://hl7.org/fhir/Patient/1",
		"type": "Patient"
	},
	"authored" : "2018-02-19T14:15:00+10:00",
	"author" : { 
		"reference": "http://hl7.org/fhir/Practitioner/example",
		"type": "Practitioner"
	},
	"source" : { 
		"reference": "http://hl7.org/fhir/Patient/1",
		"type": "Patient"
	},
	"item": ['
		. $results.
		'
	]
}';

	$myfile = fopen("../testResources/k10-response.json", "w") or die("Unable to open file!");

	fwrite($myfile, $data);
	fclose($myfile);
	
?>