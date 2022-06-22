export async function getActiveTab(){
    let queryOption = { active:true, currentWindow:true };
    let [tab] = await chrome.tabs.query(queryOption);
    return tab;
}