import {getActiveTab} from './util.js';

const fetchTocken = async () => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(["token"], (obj) => {
            resolve(obj["token"]);
        });
    })
}

const isTokenErrored = async () => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(["token_errored"], (obj) => {
            resolve(obj["token_errored"]);
        });
    })
}

document.addEventListener("DOMContentLoaded", async() => {
    const tab = await getActiveTab();
    const animeName = tab.url.split("/")[4];

    if(tab.url && tab.url.includes("voiranime.com") && animeName){
        const token = await fetchTocken();
        const errored = await isTokenErrored();
        console.log("errored: " + errored);
        if((token && token != "") || errored=="true"){
            document.getElementById("login").innerHTML = "<p color='green'> Vous êtes connecté ! </p> <button id='deco_btn'> Se déconnecter </button>";
            document.getElementById("deco_btn").addEventListener("click", () => {
                chrome.storage.sync.set({
                    "token": ""
                }, () => {console.log("token delete");});
                location.reload()
            });
        }
    }else{
        document.getElementById("container").innerHTML = "<a id='valink' href='https://voiranime.com/' target='_blank' color='red'>Vous devez être sur voiranime pour utiliser l'extension</a>";
    }
});

