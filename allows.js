function display() {
    chrome.storage.sync.get(["allows"], function(list) {
        var chanList = document.getElementById('chanList');
        var i;
        for (i = 0; i < list.allows.length; i++) {
            var entry = document.createElement('li');
            entry.appendChild(document.createTextNode(list.allows[i].display));
            chanList.appendChild(entry);
        } 
    })
}

document.addEventListener("DOMContentLoaded", function(event) {
    display();
});
