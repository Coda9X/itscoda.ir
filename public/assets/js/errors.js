document.addEventListener("DOMContentLoaded", function () {
    var eElm = document.querySelector("[error]");
    var rElm = Array.from(document.querySelectorAll("p > span, h2 > span"));
    if (!eElm)
        return;
    var target = parseInt(eElm.getAttribute("error") || "0", 10);
    if (isNaN(target))
        return;
    var current = 0;
    var speed = 5;
    var removeSkullClass = function () {
        rElm.forEach(function (el) { return el.classList.remove("hi"); });
    };
    var counter = setInterval(function () {
        if (current >= target) {
            clearInterval(counter);
            eElm.textContent = target.toString().padStart(3, "0");
            removeSkullClass();
        }
        else {
            eElm.textContent = (++current).toString().padStart(3, "0");
        }
    }, speed);
});
