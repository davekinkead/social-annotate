'use strict';

document.querySelector('#go-to-options').addEventListener('click', function(e) {
  console.log('Options clicked!');
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});

// Display the number of annotated users in the storage.
var survey = '';
var surveyDropdown = document.getElementById('dropdown-menu');
chrome.storage.local.get('config', function(data) {
  for (var key in data.config.surveys){
    var option = document.createElement('li');
    option.data = key;
    option.addEventListener("click", function(){
        document.getElementById('survey-id').innerHTML = this.data
    });
    option.innerHTML = "<a href='#'>" + key + "</a>";
    surveyDropdown.appendChild(option);
    
    // Set the default as the latest one
    survey = key;
    document.getElementById('survey-id').innerHTML = survey;
    data.config.activeSurvey = survey; 
    // TODO: We need to be able to update this current-survey value on config.
  }
});

var annotationCountSpan = document.getElementById('annotationCount');
chrome.storage.local.get('annotatedUserIDs', function(data) {
  let annotationCount = 0;
  annotationCount = data.annotatedUserIDs.length;
  annotationCountSpan.innerText = annotationCount;
});

document.querySelector('#exportLink').addEventListener('click', function(e) {
    chrome.storage.local.get('resultsArray', function(data) {
        var resultsArray = data.resultsArray;
        exportStoredResults(resultsArray);
    });
});

var toggleGuidedCheckbox = document.querySelector('#toggleGuidedMode');

function updateInterface (disableLink) {
    chrome.storage.local.get(['isEnabled','isGuided'], function(data) {
        let linkText = '';
        if (data.isEnabled === true) {
            linkText = "Disable";
        } else {
            linkText = "Enable";
        }
        disableLink.innerHTML = linkText;
        
        if (data.isGuided === true) {
            toggleGuidedCheckbox.checked = true;
        } else {
            toggleGuidedCheckbox.checked = false;
        }
    });
}

var disableLink = document.querySelector('#disableLink');
// Populate the interface for initial values.
updateInterface(disableLink);

disableLink.addEventListener('click', function(e) {
    // use the link/button as a toggle, toggle between disable and enable.
    // get the current status, flip it and store it again.
    chrome.storage.local.get('isEnabled', function(data) {
        let tempValue = !data.isEnabled;
        chrome.storage.local.set({"isEnabled": tempValue}, function() {
            updateInterface(disableLink)
        });
    });
    // Update the interface (for now just the toggle link)

});


toggleGuidedCheckbox.addEventListener('click', function(e) {
    
    var isChecked = false;
    if (toggleGuidedCheckbox.checked == true){
        isChecked = true;
    }

    chrome.storage.local.set({"isGuided": isChecked}, function() {} );
});

// @TODO First line is getting messed up as undefined, figure that out.
function exportStoredResults (items) {
    // Save as file
    var csvResults = objectList2csv(items);
    
    var url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(csvResults);
    chrome.downloads.download({
        url: url,
        filename: 'annotations.csv'
    });
}

function objectList2csv(items) {
    var csv = ''
    
    // Loop the array of objects
    for(let row = 0; row < items.length; row++){
        let keysAmount = Object.keys(items[row]).length
        let keysCounter = 0

        // If this is the first row, generate the headings
        if(row === 0){

           // Loop each property of the object
           for(let key in items[row]){

                               // This is to not add a comma at the last cell
                               // The '\r\n' adds a new line
               csv += key + (keysCounter+1 < keysAmount ? ',' : '\r\n' )
               keysCounter++
               
           }
           // So that it handles first row of DATA properly after adding headings
           keysCounter = 0
        }
        for(let key in items[row]){
           csv += items[row][key] + (keysCounter+1 < keysAmount ? ',' : '\r\n' )
           keysCounter++
        }


        keysCounter = 0
    }
    return csv
}

// @TODO add an enable/disable app switch and an enable/disable going over the list switch. 
// @TODO also throw in a link to the options page.
