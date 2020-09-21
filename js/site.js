const LOINC_FHIR_API_URL = "https://fhir.loinc.org";
// The LOINC answers don't keep track of scores. Keep track of them here
const LOINC_ANSWER_CODE_SCORES = {
	"LA6297-1": 1,
	"LA14732-4": 2,
	"LA14733-2": 3,
	"LA14734-0": 4,
	"LA6154-4": 5
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

function shortenName(name) {
	var nameRE = /((?:\w+)(?:\/|\s)?)+/g;
	return name.match(nameRE)[0];
}

function questionInput(type, value, name) {

	var input = "";
	name = shortenName(name);

	if (type == "choice" || type == "open-choice") {
		input = `<input value="${value}" name="${name}" type="radio">`;
		return input;
	}

	if (type == "decimal" || type == "integer") {
		input = `<input name="${name}" type="number">`;
		return input;
	}

	return '<input type="radio">';
}

function createQuestionaire(data) {
	// var type = ["radio", "text"];

	var questionsAmount = data.item[0].item.length;

	for (var k = 0; k < questionsAmount; k++) {

		var answers = "";
		var answersAmount;
		var input;
		var answer;

		if (data.item[0].item[k].type == "group") {
			var furtherQuestions = data.item[0].item[k].item;
			continue;
		} else {
			answersAmount = data.item[0].item[k].answerOption.length;
		}

		for (var i = 0; i < answersAmount; i++) {

			input = questionInput(data.item[0].item[k].type, data.item[0].item[k].answerOption[i].code, data.item[0].item[k].text);
			answer = `<label>${input + data.item[0].item[k].answerOption[i].valueCoding.display}</label><br>`;

			answers = answers + answer;
		}

		var name = data.item[0].item[k].text;

		var question = `<p>${name}</p>${answers}<br>`;
		$("#questionaire").append(question);
	}

	$("#questionaire").append('<input type="submit" formtarget="_self">');
}

function displayQuestionnaireResponse(responseItems) {
	// TODO: display the responses 
}

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
	console.log(data);
	//$("#whatever").text(data instanceof Error ? String(data) : JSON.stringify(data, null, 4));
	createQuestionaire(data);
}

$(document).ready(function () {

	$("#whatever").text("Loading...");

	// Set comparison data
	setNormativeScoreScale(14);

	const client = new FHIR.client("http://hapi.fhir.org/baseR4");
	data = client.request("Questionnaire/MDS3.0-SP-1.14")
		.then(display)
		.catch(display);

	// Handle This Questionnaire Response (for now just use example)
	$.ajax({
		url: "/testResources/k10-questionnaire-response.json",
		type: "GET",
		success: function (data) {
			handleQuestionnaireResponse(data);
		}
	});


	$("#questionaire").submit(function (event) {
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