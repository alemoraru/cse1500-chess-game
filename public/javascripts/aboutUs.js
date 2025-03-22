const wrapper = document.getElementById("about-us-wrapper");
const button = document.getElementById("about-us-button");
const close = document.getElementById("close");

// When the user clicks the button, show the about-us pop-up
button.onclick = function () {
    wrapper.style.display = "block";
}

// When the user clicks on #close,  close the pop-up
close.onclick = function () {
    wrapper.style.display = "none";
}

// When the user clicks anywhere outside the popup, close it
window.onclick = function (event) {
    if (event.target === wrapper) {
        wrapper.style.display = "none";
    }
}
