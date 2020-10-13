function processQuestionnaireResponses(responses) {
    // TODO: remove when done
    console.log(responses);

    var k10Responses = [];
    var phq9Responses = [];
    var otherResponses = [];
    responses.forEach((item, index) => {
        if (item.questionnaire === "https://connect4.uqcloud.net/resources/K10_kessler_psychological_distress_scale.json") {
            k10Responses.push(item);
        } else if (item.questionnaire === "https://connect4.uqcloud.net/resources/PHQ_9_Patient_Health_Questionnaire_9.json") {
            phq9Responses.push(item);
        } else {
            otherResponses.push(item);
        }
    });

    // Populate questionnaire number of responses elements, and enable questionnaires with any responses
    $("#k10-num-responses").text(k10Responses.length);
    if (k10Responses.length === 0) {
        $("#k10-link").addClass("disabled");
    } else {
        $("#k10-link").removeClass("disabled");
    }
    $("#phq9-num-responses").text(phq9Responses.length);
    if (phq9Responses.length === 0) {
        $("#phq9-link").addClass("disabled");
    } else {
        $("#k10-link").removeClass("disabled");
    }
    console.log(`${otherResponses.length} other responses found:`);
    console.log(otherResponses);

    // Hide loader and show questionnaire list
    $("#loader-container").hide();
    $("#questionnaire-list-group-container").show();
}

$(document).ready(function () {

    const client = FHIR.client({
        serverUrl: "http://hapi.fhir.org/baseR4",
        tokenResponse: {
            patient: "1303022"
        }
    });

    // Search for QuestionnaireResponses linked to this patient, returning just the array of bundle entries (rather than a bundle object)
    client.patient.request("QuestionnaireResponse", { flat: true }).then(processQuestionnaireResponses).catch(console.error);

});