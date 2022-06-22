/*
* This script is run in the context of the current tab
* so it's always loaded on page in content_scripts["matches"]
* and it needs event (why not juste check document.url ?)
*/
(async() => {
    console.log("loading request.js ...");
    const src = chrome.runtime.getURL("js/request.js");
    const request = await import(src);

    let nextPageLink, prevPageLink;
    let nextButton, prevButton;
    let currentEpisode;
    let currentAnime = "";

    console.log("content script");

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const {type, anime} = obj;
        if(type === "WATCHING_ANIME"){
            currentAnime = anime;
            setupAnimeListener();
        }
        return response({"ok": true});
    });

    function setupAnimeListener(){

        if(document.getElementById("aderox_extention_set")){
            return;
        }
        console.log("loading...");

        const div = document.createElement("div");
        div.id  = "aderox_extention_set";
        document.getElementsByClassName("logo")[0].appendChild(div);
        
        nextButton = document.getElementsByClassName("next_page")[0];
        prevButton = document.getElementsByClassName("prev_page")[0];

        nextPageLink = nextButton.getAttribute("href");
        prevPageLink = prevButton.getAttribute("href");

        nextButton.setAttribute("href", "#")
        prevButton.setAttribute("href", "#")



        const titleSlited = document.title.split("-");
        currentEpisode = parseInt(titleSlited[titleSlited.length -2]);

        if(nextButton){
            nextButton.addEventListener("click", () => {
                updateAnime(currentAnime, currentEpisode, true).then(() => {location.href = nextPageLink}).catch((e) => {handleError(e, true)}); //nextPageLink
            });    
        }

        if(prevButton){
            prevButton.addEventListener("click", () => {
                updateAnime(currentAnime, currentEpisode, false).then(() => {location.href = prevPageLink}).catch((e) => {handleError(e, false)});
            });
        }
    }

    /**
     * @param {string} animeName the anime name undetited (with '-' instead of ' ')
     * @param {int} currentEpisode the episode the user JUST watched. Can be null
     * @param {boolean} nextEpisode true if next, false if previous. Default is true
     * @returns {Promise<boolean>}
     * @description
     */
    async function updateAnime(animeName, currentEpisode, nextEpisode = true){
        animeName = animeName.split('-').join(' ');
        console.log(animeName);
        console.log(currentEpisode);
        console.log(nextEpisode);

        const episode = nextEpisode ? currentEpisode + 1 : currentEpisode - 1;

        try{
            const instanceRequest = request.getRequestApiInstance();
            const animeId = await instanceRequest.getAnimeIDByName(animeName);
            console.log("anime id: " + animeId);
            
            const token = await fetchTocken();

            const mediaListEntryID = await instanceRequest.getMediaListEntryByAnimeID(animeId, token)
            console.log("mediaListEntryID :");
            console.log(mediaListEntryID);

            const updatedMediaList = await instanceRequest.updateMediaList(animeId, mediaListEntryID, episode, token);
            console.log("updated: ");
            console.log(updatedMediaList);

        }catch(e){
            handleError(e, nextEpisode);
        }

    }


    const fetchTocken = async () => {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(["token"], (obj) => {
                resolve(obj["token"]);
            });
        })
    }

    const handleError = (e, nextButton) => {
        //TODO popUp! 
        alert("error !");
        const link = nextButton ? nextPageLink : prevPageLink;
        location.href = link;
    }


})();

//https://youtu.be/0n809nd4Zu4?t=3212