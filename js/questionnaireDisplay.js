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
	//get questions from the questionnaire FHIR json
	//it is an depth-frst search algorithm
	//the functions get the questions and push them into an array
	//TODO: Expand the function to correctly works with nested questions and sections

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
	//get patient answers from an answer FHIR json
	//it is an depth-frst search algorithm
	//the functions get the answers and push them into an array
	//TODO: Expand the function to correctly works with nested responses and sections

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

//global question prefix
var questionPrefix = 1;

function getPrefix(question) {
	//generate a question prefix based on quesiton ID if the prefix is missing in FHIR resource
	//question: an array containning information about the question
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
	//get display text of the question from the FHIR resource
	//question: an array containning information about the question
	return question[2];
}

function getAnswers(question) {
	//get possinle answers of the question from the FHIR resource
	//question: an array containning information about the question
	return question[4];
}

function getValue(answer) {
	//get the code of the answer of the question from the FHIR resource
	//answer: an answer object containning information about the answer
	return answer.valueCoding.code;
}

function createAnswerId(answer, name) {
	//create an id for the answer based on it's display and name
	//answer: an answer object containning information about the answer
	//name: the name of the answer
	var re = /(?:\w+)/g;
	var id = answer.match(re)[0];
	return `${name}-${id}`;
}

function createAnswerName(question) {
	//create name for answers associated with the question
	//question: an array containning information about the question
	return `question-${question[0]}`
}

function getAnswerCode(answer) {
	//get the clinical code of the answer
	//answer: an answer object containning information about the answer
	return answer.valueCoding.code;
}

function getCheckedAnswer(response) {
	//get user answers
	//response: a FHIR questionnaire response object
	if (response != undefined) {
		var answerCode = getAnswerCode(response[2][0]);
		return answerCode;
	}
	return "";
}

function createAnswerLabel(question, location) {
	//create the display label for the answer
	//question: question object
	//location: id of the parent element
	var numberOfAnswer = question[question.length - 1].length;
	for (var i = 0; i < numberOfAnswer; i++) {
		var label = question[question.length - 1][i].valueCoding.display;

		$(`#${location}`).append(`
			<span class="radio-label">${label}</span>
			`);
	}
}

function displayQuestionnaire(questions, responseJson, formDisplay) {
	//display questionnaire in the website as a form
	//question: question object
	//responseJson: user questionnaire response object, if it is present, the function will fill the questionnaire
	//				with the user response, and make the form readonly
	//formDisplay: id of the parent element to insert the form as children

	var group = 1;

	//create header and column labels
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

	//check whether the form is readonly
	var readOnly = (responseJson == null) ? "" : "disabled";

	//create questions and put them into the form
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

	//create form control buttons if the form is not readonly
	if (responseJson == null) {

			$(`#${formDisplay}`).append(`<div class="row" id="form-controls"></div>`);

			$(`#form-controls`).append(`<div class="col-2">
				<a class="nav-link back-button mt-4" href="/index.html">Cancel</a>
			</div>`);

			$(`#form-controls`).append(`<div class="col-2">
				<button type="submit" class="btn btn-primary mt-4 px-5 submit-button" form="questionnaire" value="Submit">Submit</button>
			</div>`);
	}
}

function displayUserResponse(responseJson, questionnaire, display) {
	//display user response
	//responseJson: user response object
	//questionnaire: path to questionnaire FHIR json file
	//display: the id of the parent element to put the response in
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