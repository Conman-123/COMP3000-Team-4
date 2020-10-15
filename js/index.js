function processQuestionnaireResponses(responses) {
    // TODO: remove when done
    console.log(responses);

    var k10Responses = [];
    var phq9Responses = [];
    var otherResponses = [];
    responses.forEach((item, index) => {
        if (isQuestionnaireResponseK10(item)) {
            k10Responses.push(item);
        } else if (isQuestionnaireResponsePHQ9(item)) {
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
        $("#phq9-link").removeClass("disabled");
    }
    console.log(`${otherResponses.length} other responses found:`);
    console.log(otherResponses);

    // Hide loader and show questionnaire list
    $("#loader-container").hide();
    $("#questionnaire-list-group-container").show();
}

// -- Globals --
var globalClient;

function initPage(client) {
    // Search for QuestionnaireResponses linked to this patient, returning just the array of bundle entries (rather than a bundle object)
    client.patient.request("QuestionnaireResponse", { flat: true }).then(processQuestionnaireResponses).catch(console.error);
    globalClient = client;
}

// ---- TEMP Until Questionnaires can be created -----
$(document).ready(function() {
    $("#btn-do-k10").click(function() {
       $.ajax({
           url: "/testResources/k10-response-hapi-test.json",
           success: function(data) {
               data.subject.reference = "Patient/" + globalClient.patient.id;
               postQuestionnaireResponse(globalClient, data).then(function(success) {
                   if (success === true) window.location.reload();
               });
           }
       });
    });
});