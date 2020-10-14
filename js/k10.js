const LOINC_FHIR_API_URL = "https://fhir.loinc.org";
// The LOINC answers don't keep track of scores. Keep track of them here

const LOINC_ANSWER_CODE_SCORES = {
	"LA6297-1": 1,
	"LA14732-4": 2,
	"LA14733-2": 3,
	"LA14734-0": 4,
	"LA6154-4": 5
}

Chart.plugins.register({
	beforeDraw: function (chartInstance, easing) {
		var ctx = chartInstance.chart.ctx;
		ctx.fillStyle = '#eee'; // Set background colour here

		var chartArea = chartInstance.chartArea;
		ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
	}
});

function getk10WordScore(score) {
	if (score < 20) {
		return "good";
	} else if (score < 25) {
		return "mild";
	} else if (score < 30) {
		return "moderate";
	} else {
		return "severe";
	}
};

function setScoreScale(score) {
	// Convert score to a percentage of max possible score
	var scorePercent = ((score - 10) / 40) * 100;
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
	// Convert score to a percentage of max possible score (setting the minimum to zero rather than ten)
	var scorePercent = ((score - 10) / 40) * 100;
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
		var score = LOINC_ANSWER_CODE_SCORES[answer[0].valueCoding.code];
		if (score) {
			return score;
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
	$("#analysis-" + getk10WordScore(score)).show();
}

function setNextSteps(score) {
	$(".next-steps-good, .next-steps-mild, .next-steps-moderate, .next-steps-severe").hide();
	$(".next-steps-" + getk10WordScore(score)).show();
}

function handlePreviousScores(allOrderedResponses, currentResponse) {
	var dateArray = [];
	var scoreArray = [];
	// Create array of background colors for the bars so the current bar can be a different colour
	var barColors = [];
	allOrderedResponses.forEach(function(val, index) {
		var isCurrent = val === currentResponse;
		var dateString = val.response.authored ? val.response.authored : `Date Unknown (ID ${item.id})`;
		dateArray.push(isCurrent ? dateString + " (Current)" : dateString);
		scoreArray.push(val.score);
		barColors.push(isCurrent ? "#0573a4" : "#043a5e");
	});

	var graphContext = document.getElementById("previous-scores-graph").getContext("2d");
	if (graph) graph.destroy(); // Reset the graph to fix bugs that were happening
	graph = new Chart(graphContext, {
		type: "bar",
		data: {
			labels: dateArray,
			datasets: [{
				backgroundColor: "#043a5e",
				data: scoreArray,
				backgroundColor: barColors ? barColors : "#043a5e"
			}]
		},
		options: {
			maintainAspectRatio: false,
			/*aspectRatio: 1.5,*/
			scales: {
				yAxes: [{
					type: "linear",
					ticks: {
						min: 0,
						max: 50,
						fontColor: "#ffffff"
					},
					gridLines: {
						display: false
					}
				}],
				xAxes: [{
					ticks: {
						fontColor: "#ffffff"
					},
					gridLines: {
						display: false
					}
				}]
			},
			legend: {
				display: false
			}
		}
	});
}

function handleQuestionnaireResponseAndScore(responseAndScore) {
	setScoreScale(responseAndScore.score);

	// Set relevant data analysis
	setDataAnalysis(responseAndScore.score);

	// Set relevant next steps
	setNextSteps(responseAndScore.score);
}

function calculateQuestionnaireScore(responseJson) {
	var scores = [];
	// Get scores for each answer
	for (var i = 0; i < responseJson.item.length; i++) {
		item = responseJson.item[i];
		var score = getAnswerScore(item.answer);
		if (score > 0) {
			scores.push(score);
		}
	}

	// Calculate total score
	var totalScore = scores.reduce((total, value) => total + value);
	return totalScore;
}

function display(data) {
	var questions = getQuestionData(data.item);
	displayQuestionnaire(questions, null, "questionnaire");
}

// -- GLOBALS --
var k10Responses;
var k10ResponsesAndScores = [];
var graph;

async function initPage(client) {
	// Get all of this patient's K10 questionnaire responses
	k10Responses = [];
	var allResponses = await client.patient.request("QuestionnaireResponse", { flat: true });
	console.log(allResponses);
	allResponses.forEach((item) => {
		if (isQuestionnaireResponseK10(item)) k10Responses.push(item);
	});

	if (k10Responses.length === 0) {
		console.error("No K10 questionnaire found");
		// TODO: Handle no k10 questionnaire responses (show a message to the user, with the option to complete a new questionnaire response)
		return;
	}

	// Sort by date questionnaire was taken
	sortQuestionnaireResponsesByDate(k10Responses);
	// Cannot change order from here (yes it's not good code but I don't have time to do it properly)
	
	// Handle the case for multiple k10 questionnaire responses
	if (k10Responses.length > 1) {
		// Create drop down HTML
		var dropDownHtml = "";
		k10Responses.forEach((item, index) => {
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
	for (var i = 0; i < k10Responses.length; i++) {
		var score = calculateQuestionnaireScore(k10Responses[i]);
		k10ResponsesAndScores.push({
			score: score,
			response: k10Responses[i]
		});
	}
	
	// Use the most recent questionnaire (with a known authored date) response by default
	var mostRecentResponseAndScore = k10ResponsesAndScores[k10ResponsesAndScores.length - 1]; // Default to show the last questionnaire if no date found
	for (var i = k10ResponsesAndScores.length - 1; i >= 0; i--) {
		var response = k10ResponsesAndScores[i].response;
		if (response.authored) {
			mostRecentResponseAndScore = k10ResponsesAndScores[i];
			break;
		}
	}
	handleQuestionnaireResponseAndScore(mostRecentResponseAndScore);
	displayUserResponse(mostRecentResponseAndScore.response, "/resources/K10_kessler_psychological_distress_scale.json", "questionnaireResponse");

	// Set current questionnaire as active in the dropdown
	var indexOfCurrent = k10ResponsesAndScores.indexOf(mostRecentResponseAndScore);
	$(`.previous-versions-dropdown .dropdown-item[data-index="${indexOfCurrent}"]`).addClass("active");

	// Populate Previous Scores Graph
	handlePreviousScores(k10ResponsesAndScores, mostRecentResponseAndScore);
	
	// Set comparison data
	setNormativeScoreScale(14); // TEMPORARY!!!! TODO: CHANGE THIS

}

$(document).ready(function() {

	$(".previous-versions-dropdown").on("click", ".dropdown-item", function() {
		var responseAndScore = k10ResponsesAndScores[$(this).first().attr("data-index")];
		handleQuestionnaireResponseAndScore(responseAndScore);
		displayUserResponse(responseAndScore.response, "/resources/K10_kessler_psychological_distress_scale.json", "questionnaireResponse");
		// Update Previous Scores Graph
		handlePreviousScores(k10ResponsesAndScores, responseAndScore);
		// Make this questionnaire response active in the dropdown		
		$(".previous-versions-dropdown .dropdown-item").removeClass("active");
		$(this).addClass("active");
	});

});