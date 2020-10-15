// The LOINC answers don't keep track of scores. Keep track of them here
const LOINC_ANSWER_CODE_SCORES = {
	"LA6568-5": 0,
	"LA6569-3": 1,
	"LA6570-1": 2,
	"LA6571-9": 3
}

function getPHQ9WordScore(score) {
	if (score < 5) {
		return "good";
	} else if (score < 10) {
		return "mild";
	} else if (score < 15) {
		return "moderate";
	} else if (score < 20) {
		return "moderately-severe";
	} else {
		return "severe";
	}
};

function setScoreScale(score) {
	// Convert score to a percentage of max possible score
	var scorePercent = (score / 27) * 100;
	// Move the score marker to this percentage along the total width of the score scale
	// Also transform it left by this percentage of its own width so it never goes over the edges of the scale
	//		(e.g. a score of 100% will transform the marker left 100% of its own width)
	$("#overall-score-container").css({
		"left": scorePercent + "%",
		"transform": "translateX(-" + scorePercent + "%)"
	});
	// Set the score value
	$("#score-value").text(score);
}
function setNormativeScoreScale(score) {
	// Convert score to a percentage of max possible score
	var scorePercent = (score / 27) * 100;
	// Move the score marker to this percentage along the total width of the score scale
	// Also transform it left by this percentage of its own width so it never goes over the edges of the scale
	//		(e.g. a score of 100% will transform the marker left 100% of its own width)
	$("#breakdown-score-container").css({
		"left": scorePercent + "%",
		"transform": "translateX(-" + scorePercent + "%)"
	});
}

function getAnswerScore(answer) {
	if (answer[0]?.valueCoding?.system == "http://loinc.org") {
		var code = answer[0].valueCoding.code;
		if (code in LOINC_ANSWER_CODE_SCORES) {
			return LOINC_ANSWER_CODE_SCORES[code];
		} else {
			console.error("Unknown code for answer: " + answer)
		}
	} else {
		console.error("Unkonwn code system for answer: " + answer);
	}
	// If reached here, errored. Return -1 to signal error
	return -1;
}

function setDataAnalysis(score) {
	$("#analysis-good, #analysis-mild, #analysis-moderate, #analysis-severe").hide();
	$("#analysis-" + getPHQ9WordScore(score)).show();
}

function setNextSteps(score) {
	$(".next-steps-good, .next-steps-mild, .next-steps-moderate, .next-steps-severe").hide();
	$(".next-steps-" + getPHQ9WordScore(score)).show();
}

function getItemScores(item) {
	var scores = [];
	if (item.linkId === "2") {
		// This question is not scored
		return scores;
	}

	if (item.hasOwnProperty("answer")) {
		var score = getAnswerScore(item.answer);
		if (score > 0) {
			scores.push(score);
		}
	} else if (item.hasOwnProperty("item")) {
		for (var i = 0; i < item.item.length; i++) {
			var subScores = getItemScores(item.item[i]);
			subScores.forEach(function(val) {
				scores.push(val);
			});
		}
	}
	return scores;
}

function handleQuestionnaireResponseAndScore(responseAndScore) {
	setScoreScale(responseAndScore.score);

	// Set relevant data analysis
	setDataAnalysis(responseAndScore.score);

	// Set relevant next steps
	setNextSteps(responseAndScore.score);
}

function calculateQuestionnaireScore(responseJson) {
	var scores = getItemScores(responseJson);
	var totalScore = scores.reduce((total, value) => total + value);
	return totalScore;
}

function oldInitPage() {
	// Set comparison data
	setNormativeScoreScale(5); // TEMPORARY!!!! TODO: CHANGE THIS

	// Test displaying PHQ-9 questionnaire

	// Handle This Questionnaire Response (for now just use example)

	$("#questionnaire").submit(function (event) {
		$.ajax({
			type: "POST",
			url: "serverUrl",
			data: formData,
			success: function () { },
			dataType: "json",
			contentType: "application/json"
		});

		event.preventDefault();
	});
}

// -- GLOBALS --
var phq9Responses;
var phq9ResponsesAndScores = [];
var graph;

async function initPage(client) {
	// Get all of this patient's PHQ9 questionnaire responses
	phq9Responses = [];
	var allResponses = await client.patient.request("QuestionnaireResponse", { flat: true });
	console.log(allResponses);
	allResponses.forEach((item) => {
		if (isQuestionnaireResponsePHQ9(item)) phq9Responses.push(item);
	});

	if (phq9Responses.length === 0) {
		console.error("No PHQ9 questionnaire responses found");		
		$("#error-modal").modal("show");
		return;
	}

	// Sort by date questionnaire was taken
	sortQuestionnaireResponsesByDate(phq9Responses);
	// Cannot change order from here (yes it's not good code but I don't have time to do it properly)

	// Handle the case for multiple phq9 questionnaire responses
	if (phq9Responses.length > 1) {
		// Create drop down HTML
		var dropDownHtml = "";
		phq9Responses.forEach((item, index) => {
			var html = `<button class="dropdown-item" data-index="${index}">`;
			if (item.authored) {
				html += htmlEntities(item.authored);
			} else {
				html += "Date Unknown (ID " + htmlEntities(item.id) + ")";
			}
			html += "</button>";
			dropDownHtml += html;
		});
		// Add drop down html to the "Previous Versions" dropdown
		$(".previous-versions-dropdown .dropdown-menu").html(dropDownHtml);
	}

	// Loop through responses and calculate scores
	for (var i = 0; i < phq9Responses.length; i++) {
		var score = calculateQuestionnaireScore(phq9Responses[i]);
		phq9ResponsesAndScores.push({
			score: score,
			response: phq9Responses[i]
		});
	}

	// Use the most recent questionnaire (with a known authored date) response by default
	var mostRecentResponseAndScore = phq9ResponsesAndScores[phq9ResponsesAndScores.length - 1]; // Default to show the last questionnaire if no date found
	for (var i = phq9ResponsesAndScores.length - 1; i >= 0; i--) {
		var response = phq9ResponsesAndScores[i].response;
		if (response.authored) {
			mostRecentResponseAndScore = phq9ResponsesAndScores[i];
			break;
		}
	}
	handleQuestionnaireResponseAndScore(mostRecentResponseAndScore);
	displayUserResponse(mostRecentResponseAndScore.response, "/resources/PHQ_9_Patient_Health_Questionnaire_9.json", "questionnaireResponse");

	// Set current questionnaire as active in the dropdown
	var indexOfCurrent = phq9ResponsesAndScores.indexOf(mostRecentResponseAndScore);
	$(`.previous-versions-dropdown .dropdown-item[data-index="${indexOfCurrent}"]`).addClass("active");

	// Populate Previous Scores Graph
	handlePreviousScores(phq9ResponsesAndScores, mostRecentResponseAndScore, 27);
	
	// Set comparison data
	setNormativeScoreScale(5); // TEMPORARY!!!! TODO: CHANGE THIS
}

$(document).ready(function() {

	$(".previous-versions-dropdown").on("click", ".dropdown-item", function() {
		var responseAndScore = phq9ResponsesAndScores[$(this).first().attr("data-index")];
		handleQuestionnaireResponseAndScore(responseAndScore);
		displayUserResponse(responseAndScore.response, "/resources/PHQ_9_Patient_Health_Questionnaire_9.json", "questionnaireResponse");
		// Update Previous Scores Graph
		handlePreviousScores(phq9ResponsesAndScores, responseAndScore, 27);
		// Make this questionnaire response active in the dropdown		
		$(".previous-versions-dropdown .dropdown-item").removeClass("active");
		$(this).addClass("active");
	});

});