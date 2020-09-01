$(document).ready(function() {

    function display(data) {
        $("#whatever").text(data instanceof Error ? String(data) : JSON.stringify(data, null, 4));
    }

    $("#whatever").text("Loading...");

    const client = new FHIR.client("http://hapi.fhir.org/baseR4");
    client.request("Questionnaire/MDS3.0-SP-1.14")
        .then(display)
        .catch(display);

});