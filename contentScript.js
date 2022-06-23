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

        if ( window.history.replaceState ) {
            window.history.replaceState( null, null, window.location.href );
        }

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
            nextButton.addEventListener("click", async () => {
                const result = await updateAnime(currentAnime, currentEpisode, true).catch((e) => {handleError(e, true)}); //nextPageLink
                console.log("result next");
                console.log(result);
                if(result && result.isOk == true){
                    location.href = nextPageLink;
                    return;
                }
                handleError(undefined, true);
            });    
        }

        if(prevButton){
            prevButton.addEventListener("click", async () => {
                const result = await updateAnime(currentAnime, currentEpisode, false).catch((e) => {handleError(e, false)});
                console.log("result prev");
                console.log(result);
                if(result && result.isOk == true){
                    location.href = prevPageLink;
                    return;
                }
                handleError(undefined, true);
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

        const episode = nextEpisode ? currentEpisode + 1 : currentEpisode - 1;

        const instanceRequest = request.getRequestApiInstance();

        const animeId = await instanceRequest.getAnimeIDByName(animeName).catch((e) => {throw e});
            
        const token = await fetchTocken();
        console.log("token: " + token);

        const mediaListEntryID = await instanceRequest.getMediaListEntryByAnimeID(animeId, token).catch((e) => {throw e})

        const updatedMediaList = await instanceRequest.updateMediaList(animeId, mediaListEntryID, episode, token).catch((e) => {throw e});
        console.log("media updated: " + updatedMediaList);
        console.log("no error !");

        chrome.storage.sync.set({
            "token_errored": false
        }, () => {console.log("token set to not errored");});

        return {"isOk": true};

    }


    const fetchTocken = async () => {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(["token"], (obj) => {
                resolve(obj["token"]);
            });
        })
    }


    const handleError = async(e, nextButton) => {
        console.log("handle error !");
        if(!e){
            console.log("no error");
            return;
        }

        console.log(e);
        const menuBar = document.getElementsByClassName("c-sub-header-nav")[0]
        const link = nextButton ? nextPageLink : prevPageLink;

        if(document.getElementById("aderox_extention_error")){
            setTimeout(function(){location.href = link;}, 2000, link);
            return;
        }

        if(menuBar){
            const errorDiv = document.createElement("div");
            errorDiv.id = "aderox_extention_error";
            errorDiv.style.color = "white";
            errorDiv.style.backgroundColor = "red";
            errorDiv.style.textAlign = "center";
            errorDiv.innerHTML = "Erreur lors de la mise à jour de votre liste de lecture. Vous devriez peut-être vous recconecter.";
            menuBar.appendChild(errorDiv);

            chrome.storage.sync.set({
                "token_errored": true
            }, () => {console.log("token set to errored");});

            setTimeout(function(){location.href = link;}, 2500, link);
            
            return;
        }
    }


})();

