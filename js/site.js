function isQuestionnaireResponseK10(response) {
    if (!response) return false;
    return response.questionnaire === "https://connect4.uqcloud.net/resources/K10_kessler_psychological_distress_scale.json"
}

function isQuestionnaireResponsePHQ9(response) {
    if (!response) return false;
    return response.questionnaire === "https://connect4.uqcloud.net/resources/PHQ_9_Patient_Health_Questionnaire_9.json"
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sortQuestionnaireResponsesByDate(responses) {
    responses.sort(function(a, b) {
        // Responses with no date should be last
        if (!a.authored && b.authored) return 1;
        if (a.authored && !b.authored) return -1;
        if (!a.authored && !b.authored) return a.id - b.id;
        // Otherwise sort by date
        return (a.authored < b.authored) ? -1 : ((a.authored > b.authored) ? 1 : 0);
    });
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

function truncate(str, maxNumCharacters) {
    return str.length > maxNumCharacters ? "..." + str.slice(-1 * (maxNumCharacters - 1)) : str;
}

function handlePreviousScores(allOrderedResponses, currentResponse, maxPossibleScore) {
	var dateArray = [];
	var scoreArray = [];
	// Create array of background colors for the bars so the current bar can be a different colour
	var barColors = [];
	allOrderedResponses.forEach(function(val, index) {
		var isCurrent = val === currentResponse;
        var dateString;
        if (val.response.authored) {
          dateString = val.response.authored;
          if (dateString.indexOf("T") > -1) {
              // Only show date (not the long time part)
              dateString = dateString.slice(0, dateString.indexOf("T"));
          }
        } else {
            dateString = "Unknown (ID " + truncate(val.response.id, 5) + ")";
        }
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
						max: maxPossibleScore,
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

function postQuestionnaireResponse(client, response) {
    var resultResource = client.create(response).catch(console.error);
    // Returns true on success, false otherwise
    return resultResource?.resourceType === "QuestionnaireResponse";
}

$(document).ready(function () {
    // Use this block while testing with an open FHIR server
    const client = FHIR.client({
        serverUrl: "http://hapi.fhir.org/baseR4",
        tokenResponse: {
            patient: "1303022"
        }
    });
    initPage(client);

    // Use this line instead when using a SMART on FHIR auth server
    //FHIR.oauth2.ready().then(initPage).catch(console.error);

    $("#k10").click(function () {
    	window.location.href = "K10Questionnaire.html";
    });

    $("#phq-9").click(function () {
    	window.location.href = "PHQ9Questionnaire.html";
    });
});