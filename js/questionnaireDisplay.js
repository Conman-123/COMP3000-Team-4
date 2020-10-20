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
	*		value(int): value of the answer
	*		name(str): display text of the answer
	*
	*	Return:
	*		str: input html element
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

function getQuestionData(data) {

	var questions = [];

	stack = data.slice().reverse(); // Slice so it creates a new array and reverses that instead of modifying the original array (which breaks stuff)
	n = 0

	while (stack.length > 0) {
		questionData = stack.pop();

		if (questionData.type == "group") {
			if (questionData.hasOwnProperty("item")) {
				stack = stack.concat(questionData.item.slice().reverse()); // Slice so it creates a new array and reverses that instead of modifying the original array (which breaks stuff)
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

function getAnswerData(data) {
	var answers = [];

	stack = data.slice().reverse(); // Slice so it creates a new array and reverses that instead of modifying the original array (which breaks stuff)
	n = 0

	while (stack.length > 0) {
		answerData = stack.pop();

		if (answerData.hasOwnProperty("item")) {
			stack = stack.concat(answerData.item.slice().reverse()); // Slice so it creates a new array and reverses that instead of modifying the original array (which breaks stuff)
		} else {
			var answer = [
				answerData.linkId,
				answerData.text,
				answerData.answer
			];

			answers.push(answer);
		}
	}

	return answers;
}

var questionPrefix = 1;

function getPrefix(question) {
	var prefix = question[1];
	var group = 0;

	if (group != question[0].split(".")[0]) {
		group = question[0].split(".")[0];
		questionPrefix = 1;
	}

	if (prefix == null) {
		prefix = `${group}.${questionPrefix}`;
		questionPrefix += 1;
	}

	return prefix;
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

function getAnswerCode(answer) {
	return answer.valueCoding.code;
}

function getCheckedAnswer(response) {
	if (response != undefined) {
		var answerCode = getAnswerCode(response[2][0]);
		return answerCode;
	}
	return "";
}

function createAnswerLabel(question, location) {
	var numberOfAnswer = question[question.length - 1].length;
	for (var i = 0; i < numberOfAnswer; i++) {
		var label = question[question.length - 1][i].valueCoding.display;

		$(`#${location}`).append(`
			<span class="radio-label">${label}</span>
			`);
	}
}

function displayQuestionnaire(questions, responseJson, formDisplay) {
	var group = 1;
	$(`#${formDisplay}`).html("");
	$(`#${formDisplay}`).append(`
			<div class="row questionnaire-row question-label">
				<div class="col-4">
					<span></span>
				</div>

				<div class="col-8 answer-col" id="col-label">
				</div>
			</div>
		`);

	createAnswerLabel(questions[0], "col-label");

	var readOnly = (responseJson == null) ? "" : "disabled";

	for (var i = 0; i < questions.length; i++) {

		if (group != questions[i][0].split(".")[0]) {
			group = questions[i][0].split(".")[0];
			$(`#${formDisplay}`).append(`
				<div class="row questionnaire-row question-label">
					<div class="col-4">
						<span></span>
					</div>

					<div class="col-8 answer-col" id="group-separator-${group}">
					</div>
				</div>
				`);
			createAnswerLabel(questions[i], `group-separator-${group}`);
		}

		var prefix = getPrefix(questions[i]);
		var display = getDisplayText(questions[i]);
		
		var name = createAnswerName(questions[i]);
		var answers = getAnswers(questions[i]);
		var answersText = "";

		var checked = (responseJson == null) ? "" : getCheckedAnswer(responseJson[i]);

		for (var k = 0; k < answers.length; k++) {
			var value = getValue(answers[k]);
			var text = answers[k].valueCoding.display;
			var id = createAnswerId(text, name);
			var isChecked = (checked === value) ? "checked" : "";

			answersText += `
				<div class="form-check form-check-inline">
					<label>
						<input class="form-check-input" id="${id}" name="${name}" type="radio" value="${value}" ${isChecked} ${readOnly}>
						<span>
							<img src="/img/check.png">
						</span>
					</label>
				</div>
			`;
		}

		var questionContainer = `
				<div class="row questionnaire-row-${i%2}">
					<div class="col-4 question-col">${prefix} ${display}</div>
					<div class="col-8 answer-col">
						${answersText}
					</div>
				</div>
			`;

		$(`#${formDisplay}`).append(questionContainer);
	}

	if (responseJson == null) {

			$(`#${formDisplay}`).append(`<div class="row" id="form-controls"></div>`);

			$(`#form-controls`).append(`<div class="col-2">
				<a class="nav-link back-button mt-4" href="/index.html">Go Back</a>
			</div>`);

			$(`#form-controls`).append(`<div class="col-2">
				<button type="submit" class="btn btn-primary mt-4 px-5 submit-button" form="questionnaire" value="Submit">Submit</button>
			</div>`);
	}
}

function displayUserResponse(responseJson, questionnaire, display) {

	$.ajax({
		url: questionnaire,
		type: "GET",
		success: function (data) {
			var questions = getQuestionData(data.item);
			var response = getAnswerData(responseJson.item);
			displayQuestionnaire(questions, response, display);
		}
	});
}