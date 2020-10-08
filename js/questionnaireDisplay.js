function shortenName(name) {
	/*
	*	Create a shorten version of question name
	*	
	*	Param:
	*		name(str): question name
	*
	*	Return: the first characters of name upto a comma
	*/
	var nameRE = /((?:\w+)(?:\/|\s)?)+/g;
	return name.match(nameRE)[0];
}

function questionInput(type, value, name) {
	/*
	*	Create answer input, currently only support radio button
	*	
	*	Param:
	*		type(str): type of input
	*		value(int): 
	*/

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

function displayQuestionnaireResponse(responseItems) {
	// TODO: display the responses 
}

var questions = [];

function getQuestionData(data) {
	// var type = ["radio", "text"];

	stack = data.reverse();
	n = 0

	while (stack.length > 0) {
		questionData = stack.pop();

		if (questionData.type == "group") {
			if (questionData.hasOwnProperty("item")) {
				stack = stack.concat(questionData.item.reverse());
			}
		} else {
			var question = [
				questionData.linkId,
				questionData.prefix,
				questionData.text,
				questionData.type,
				questionData.answerOption
			];

			questions.push(question);
		}
	}

	return questions;
}

function getPrefix(question) {
	return question[1];
}

function getDisplayText(question) {
	return question[2];
}

function getAnswers(question) {
	return question[4];
}

function getValue(answer) {
	return answer.valueCoding.code;
}

function createAnswerId(answer, name) {
	var re = /(?:\w+)/g;
	var id = answer.match(re)[0];
	return `${name}-${id}`;
}

function createAnswerName(question) {
	return `question-${question[0]}`
}

function displayQuestionaire(quesions) {
	$("#questionaire").append(`
			<div class="row questionnaire-radio-group-label-row">
				<div class="col-8 offset-4 answer-col" id="colLabel">
				</div>
			</div>
		`);

	var question = questions[0];
	for (var i = 0; i < 5; i++) {
		var label = question[4][i].valueCoding.display;

		$("#colLabel").append(`
			<span class="radio-label">${label}</span>
			`);
	}

	for (var i = 0; i < questions.length; i++) {
		var prefix = getPrefix(questions[i]);
		var display = getDisplayText(questions[i]);
		
		var name = createAnswerName(questions[i]);
		var answers = getAnswers(quesions[i]);
		var answersText = "";

		for (var k = 0; k < answers.length; k++) {
			var value = getValue(answers[k]);
			var text = answers[k].valueCoding.display;
			var id = createAnswerId(text, name);

			answersText += `
				<div class="form-check form-check-inline">
					<input class="form-check-input" id="${id}" name="${name}" type="radio" value="${value}">	
				</div>
			`;
		}
		var questionContainer = `
				<div class="row questionnaire-row">
					<div class="col-4 question-col">${prefix} ${display}</div>
					<div class="col-8 answer-col">
						${answersText}
					</div>
				</div>
			`;

		$("#questionnaire").append(questionContainer);
	}

	$("#questionnaire").append(`<button type="submit" class="btn btn-primary mt-4 px-5" form="questionnaire" value="Submit">Submit</button>`);
}