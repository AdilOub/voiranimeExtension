/*
 * This script is always running in background and don't have access to the curent tab
 * so it's a listener. It trigger event with sendMessage function
 */

console.log("Extension loaded");
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!changeInfo.status === "complete") {
        return;
    }

    if (tab.url && tab.url.includes("voiranime.com/anime/")) {
        console.log("watching an anime !");
        const animeName = tab.url.split("/")[4];

        chrome.tabs.sendMessage(tabId, {
            type: "WATCHING_ANIME",
            anime: animeName
        }).then((result) => {
            //console.log(result);
            return result;
        }).catch((err) => {
            //console.log("error (if it's receving end does not exist, just leave it here)");
            //console.log(err);
        });

    } else if (tab.url && tab.url.includes("anilist.co")) {
        console.log("authentification !");
        const url = new URL(tab.url.replace("#", "?"));
        const urlParams = new URLSearchParams(url.search);
        const token = urlParams.get("access_token");
        if (token) {
            chrome.storage.sync.set({
                "token": token
            }, () => {})
        }
    }

    console.log("on resolve");
    return;
});