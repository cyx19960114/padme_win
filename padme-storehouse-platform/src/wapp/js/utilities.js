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

