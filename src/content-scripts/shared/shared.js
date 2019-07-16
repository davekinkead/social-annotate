
// @TODO Check if this ID already exists in storage, and just update if it does (avoid duplicates).
// @TODO Might have an allow duplicates checkbox in the config, if there is a use case for it.
// Race conditions should not occur because events are called sequentially. 
function getCurrentScreenName(platform) {
	if (platform === "twitter") {
		headerCardClass = 'ProfileHeaderCard-screenname';
		screenNameClass = 'u-linkComplex-target';
		headerCard = document.getElementsByClassName(headerCardClass);
		screenNameContainer = headerCard[0].getElementsByClassName(screenNameClass);	
		screenName = screenNameContainer[0].innerText;
	} else {
		throw "Not implemented yet"
	}
	
	return screenName;
}

class Context {
	// If no aux check function passed in the constructor, then no check necessary and can always
	//		return true.
	static auxillaryCheck() {
		return true;
	}
	
	constructor(contextName, injectFunction, auxCheckFunction) {
		this.name = contextName;
		this.injectSurvey = injectFunction;
		if(auxCheckFunction != null) {
			this.auxillaryCheck = auxCheckFunction;
		}
	}

};

function storeResults(surveyResults, socialMediaPlatform) {
	// get annotated count and increment that too. Also annotatedUserIDs.
	chrome.storage.local.get(['resultsArray', 'annotatedUserIDs', 'activeTargetList', 'isGuided'], function(result) {
		// console.log('Number of recorded results: ' + result.resultsArray.length);
		// @TODO Check if the user record already exists, and overwrite if it does.
		// @TODO Notify before overwriting though...
		
		// @TODO wrap these two in an object so they are always in sync, or switch to a dict.
		resultsArray = result.resultsArray;
		annotatedUserIDs = result.annotatedUserIDs;
		activeTargetList = result.activeTargetList;
		// page is not redirected until submission complete, still can pull the ID from the page.
		surveyResults.userID = getCurrentScreenName(socialMediaPlatform);
		surveyResults.timestamp = Math.floor(Date.now() / 1000);

		// @TODO: store this in the config when adding more platforms.
		if (socialMediaPlatform == 'twitter') {
			platformURL = "https://twitter.com/";
		}
		// check if this user is already in storage, and if so, where.
		let userIndex = annotatedUserIDs.indexOf(surveyResults.userID);
		if (userIndex === -1) {
			// keeping a separate list of IDs for quick access, doesn't take much space.
			// resultsArray.push(surveyResults);
			// annotatedUserIDs.push(surveyResults.userID);
			// this index appends to the end of the list.
			userIndex = resultsArray.length;
		} 
		resultsArray[userIndex] = surveyResults;
		annotatedUserIDs[userIndex] = surveyResults.userID;
		
		let lists2update = {
			'resultsArray': resultsArray, 
			'annotatedUserIDs': annotatedUserIDs, 
		};
		
		var bringNextUser = false;
		// if guided mode is enabled in the popup UI
		if (result.isGuided === true) {
			// drop the saved user ID from the list, if it exists in the list.

			// dropIndex = activeTargetList.indexOf(surveyResults.userID);
			// issue#3: making the comparison non case sensitive to handle cases
						// where twitter corrects the userid.
			dropIndex = activeTargetList.findIndex(item => surveyResults.userID.toLowerCase() === item.toLowerCase());
			if (dropIndex > -1) {  // -1 when no match
				activeTargetList.splice(dropIndex,1);  // remove 1 element, starting from dropIndex
			}
			
			// If guided mode is active and there are users in the list, determine next in line. 
			
			var nextUser = ''
			
			if (activeTargetList.length > 0) {
				bringNextUser = true;
				nextUser = activeTargetList[0]; // pop from the list when successfully submitted, not beforehand.
			}
			
			lists2update.activeTargetList = activeTargetList;
			
		}
		chrome.storage.local.set(lists2update, function() {
			if (bringNextUser === true){
				// can't use tabs api within content script.
				window.location.href = platformURL + nextUser;
			}

		});
	});
}