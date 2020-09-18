function calcK10(answers) {
	var sum = 0;

	for (var i = 0; i < answers.length; i++) {
		sum += answers[i];
	}

	if (sum < 20) {
		return "Well";
	}

	if (sum < 25) {
		return "Mild mental disorder";
	}

	if (sum < 30) {
		return "Moderate mental disorder";
	}

	return "Severe mental disorder";
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

$(document).ready(function() {
	function display(data) {
		console.log(data);
		//$("#whatever").text(data instanceof Error ? String(data) : JSON.stringify(data, null, 4));
		createQuestionaire(data);
		
	}

	$("#whatever").text("Loading...");

	const client = new FHIR.client("http://hapi.fhir.org/baseR4");
	data = client.request("Questionnaire/MDS3.0-SP-1.14")
	.then(display)
	.catch(display);

	$( "#questionaire").submit(function( event ) {
		$.ajax({
			type: "POST",
			url: "serverUrl",
			data: formData,
			success: function(){},
			dataType: "json",
			contentType : "application/json"
		});


		event.preventDefault();
	});

});