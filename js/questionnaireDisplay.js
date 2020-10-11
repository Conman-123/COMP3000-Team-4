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
	// var type = ["radio", "text"];

	var questions = [];

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

function getAnswerCode(answer) {
	return answer.valueCoding.code;
}

function getCheckedAnswer(response) {
	if (response != undefined) {
		var answerCode = getAnswerCode(response.answer[0]);
		return answerCode;
	}
	return "";
}

function displayQuestionnaire(quesions, responseJson, formDisplay) {
	$(`#${formDisplay}`).append(`
			<div class="row questionnaire-row question-label">
				<div class="col-4">
					<span>In the last 4 weeks...</span>
				</div>

				<div class="col-8 answer-col" id="col-label">
				</div>
			</div>
		`);

	var question = questions[0];

	for (var i = 0; i < 5; i++) {
		var label = question[4][i].valueCoding.display;

		$("#col-label").append(`
			<span class="radio-label">${label}</span>
			`);
	}

	var readOnly = (responseJson == null) ? "" : "disabled";

	for (var i = 0; i < questions.length; i++) {
		var prefix = getPrefix(questions[i]);
		var display = getDisplayText(questions[i]);
		
		var name = createAnswerName(questions[i]);
		var answers = getAnswers(quesions[i]);
		var answersText = "";

		var checked = (responseJson == null) ? "" : getCheckedAnswer(responseJson.item[i]);

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
			$(`#${formDisplay}`).append(`<div class="row">
		<button type="submit" class="btn btn-primary mt-4 px-5 submit-button" form="questionnaire" value="Submit">Submit</button>
		</div>
		`);
	}
	
}

function displayUserResponse(responseJson, questionnaire, display) {
	$.ajax({
		url: questionnaire,
		type: "GET",
		success: function (data) {
			var questions = getQuestionData(data.item);
			displayQuestionnaire(questions, responseJson, display);
		}
	});
}