const LOINC_FHIR_API_URL = "https://fhir.loinc.org";
// The LOINC answers don't keep track of scores. Keep track of them here
const LOINC_ANSWER_CODE_SCORES = {
	"LA6568-5": 0,
	"LA6569-3": 1,
	"LA6570-1": 2,
	"LA6571-9": 3
}

// Chart.js plugin to set chart area background color. Retrieved from https://github.com/chartjs/Chart.js/issues/3479
Chart.plugins.register({
	beforeDraw: function (chartInstance, easing) {
		var ctx = chartInstance.chart.ctx;
		ctx.fillStyle = '#eee'; // Set background colour here

		var chartArea = chartInstance.chartArea;
		ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
	}
});

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

function handlePreviousScores(currentScore) {
	// TODO: implement properly
	var dateArray = ["2019-06-24", "2020-08-16 (current)"];
	var scoreArray = [17, currentScore];
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
						max: 27,
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

function handleQuestionnaireResponse(responseJson) {
	var scores = getItemScores(responseJson);

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
var questions = [];

function display(data) {
	console.log(data);
	//$("#whatever").text(data instanceof Error ? String(data) : JSON.stringify(data, null, 4));
	questions = getQuestionData(data.item);
	console.log(questions);
	displayQuestionnaire(questions);
}

$(document).ready(function () {

	$("#whatever").text("Loading...");

	// Set comparison data
	setNormativeScoreScale(5); // TEMPORARY!!!! TODO: CHANGE THIS

	//const client = new FHIR.client("http://hapi.fhir.org/baseR4");
	//data = client.request("Questionnaire/MDS3.0-SP-1.14")
	//	.then(display)
	//	.catch(display);

	// Test displaying PHQ-9 questionnaire
	$.ajax({
		url: "/testResources/phq9-questionnaire-resource.json",
		type: "GET",
		success: function (data) {
			display(data);
		}
	});

	// Handle This Questionnaire Response (for now just use example)
	$.ajax({
		url: "/testResources/phq9-questionnaire-response.json",
		type: "GET",
		success: function (data) {
			handleQuestionnaireResponse(data);
		},
		error: function(xhr, status, error) {
			console.error(error);
		}
	});


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

});