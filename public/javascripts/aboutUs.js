var wrapper = document.getElementById("about-us-wrapper");
var button = document.getElementById("about-us-button");
var close = document.getElementById("close");
                
// When the user clicks the button, show the about-us pop-up
button.onclick = function() {
    wrapper.style.display = "block";
}

// When the user clicks on #close,  close the pop-up
close.onclick = function() {
    wrapper.style.display = "none";
}

// When the user clicks anywhere outside of the popup, close it
window.onclick = function(event) {
    if (event.target == wrapper) {
    wrapper.style.display = "none";
    }
}
