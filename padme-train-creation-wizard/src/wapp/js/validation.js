function collapsibleHandler(event) {
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      }
};

function callHelpModalUtility() {
    //JS for help Modal pop-up
    var modal = document.getElementById("myModal"); // Get the modal
    var helpLink = document.getElementById("helpModal"); // Get the button that opens the modal
    var span = document.getElementsByClassName("close")[0]; // Get the <span> element that closes the modal
    // When the user clicks the button, open the modal
    helpLink.onclick = function() { modal.style.display = "block"; }
    // When the user clicks on <span> (x), close the modal
    span.onclick = function() { modal.style.display = "none"; }
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
          modal.style.display = "none";
        }
    }
}

function getAllEnvVariables() {
  var allEnvVarsData = '<datalist id="env-vars-list"><option>FHIR_SERVER</option><option>FHIR_PORT</option><option>FHIR_API</option>';
  allEnvVarsData += '<option>MINIO_ADDRESS</option><option>MINIO_PORT</option><option>MINIO_ACCESS</option>';
  allEnvVarsData += '<option>MINIO_SECRET</option><option>MINIO_BUCKET_NAME</option><option>MINIO_OBJECT_NAME</option>';
  allEnvVarsData += '<option>PPRL_RESOLVER_URI</option><option>PPRL_DATA_DOMAIN</option><option>PPRL_RESOLVER_PROXY_URL</option>';
  allEnvVarsData += '<option>PPRL_SESSION_SECRET</option><option>PPRL_PHASE</option><option>PPRL_PSEUDONYM_LIST_URL</option>';
  allEnvVarsData += '<option>INPATIENT_CASE_NO</option><option>DATASAFE_IP</option><option>DATASAFE_PORT</option>';
  allEnvVarsData += '<option>BATCH_SIZE</option><option>NUM_EPOCH</option><option>WEIGHT_DECAY</option>';
  allEnvVarsData += '<option>MODEL_NAME</option><option>LR</option><option>STATION_NAME</option></datalist>';
  return allEnvVarsData;
}

