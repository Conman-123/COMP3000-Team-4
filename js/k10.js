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

function handlePreviousScores(currentScore) {
	// TODO: implement properly
	var dateArray = ["2019-06-24", "2020-08-16 (current)"];
	var scoreArray = [29, currentScore];
	// Create array of background colors for the bars so the current bar can be a different colour
	var barColors = [];
	// TODO: Change this to loop through all past questionnaires, and set the **CURRENT** questionnaire as the other colour NOT just the last one (cause might be viewing a past questionnaire)
	dateArray.forEach(function(val, index) {
		if (index === (dateArray.length - 1)) {
			barColors.push("#0573a4");
		} else {
			barColors.push("#043a5e");
		}
	});

	var graphContext = document.getElementById("previous-scores-graph").getContext("2d");
	var graph = new Chart(graphContext, {
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

function handleQuestionnaireResponse(responseJson) {
	var scores = [];
	// Get scores for each answer
	for (var i = 0; i < responseJson.item.length; i++) {
		item = responseJson.item[i];
		var score = getAnswerScore(item.answer);
		if (score > 0) {
			scores.push(score);
		}
	}

	// Calculate and display total score
	var totalScore = scores.reduce((total, value) => total + value);
	setScoreScale(totalScore);

	// Set relevant data analysis
	setDataAnalysis(totalScore);

	// Set relevant next steps
	setNextSteps(totalScore);

	// Handle Previous Scores
	handlePreviousScores(totalScore);
}

function display(data) {
	var questions = getQuestionData(data.item);
	displayQuestionnaire(questions, null, "questionnaire");
}

$(document).ready(function () {

	$("#whatever").text("Loading...");

	// Set comparison data
	setNormativeScoreScale(14); // TEMPORARY!!!! TODO: CHANGE THIS

	//const client = new FHIR.client("http://hapi.fhir.org/baseR4");
	//data = client.request("Questionnaire/MDS3.0-SP-1.14")
	//	.then(display)
	//	.catch(display);

	// Test displaying K10 questionnaire
	$.ajax({
		url: "/testResources/k10-questionnaire-resource-working.json",
		type: "GET",
		success: function (data) {
			display(data);
		}
	});

	// Handle This Questionnaire Response (for now just use example)
	$.ajax({
		url: "/testResources/k10-response.json",
		type: "GET",
		success: function (data) {
			handleQuestionnaireResponse(data);
			displayUserResponse(data, "/testResources/k10-questionnaire-resource-working.json", "questionnaireResponse");
		}
	});

	$("#questionnaire").submit(function (event) {
		event.preventDefault();
		results = $("#questionnaire").serializeArray();
		$.ajax({
			method: "POST",
			url: "/js/questionnaire.php",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			data: JSON.stringify(results),
			success: function (data) {
			}
		});

		window.location.replace("results.html");

	});

});