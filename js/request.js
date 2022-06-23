/*
 * An utility class for making http requests to anilist.
 */


export function getRequestApiInstance() {
    return new RequestApi();
}


class RequestApi {
    constructor(user) {
        this.user = user;
        this.url = 'https://graphql.anilist.co';
    }


    /*
     * @param {string} name the anime name undetited (with '-' instead of ' ')
     * @returns {Promise<int>} id of the anime
     */
    async getAnimeIDByName(name) {
        const query = `query ($search: String) { 
                Media (search: $search, type: ANIME) {
                    id
                    title {
                    romaji
                    english
                    native
                    }
                }
            }`;

        // Define our query variables and values that will be used in the query request
        const variables = {
            search: name.split('-').join(' ')
        };

        // Define the config we'll need for our Api request
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };

        console.log("fetching anime id...");

        const response = await fetch(this.url, options);
        try {
            const json = await response.json()
            const animeID = json.data.Media.id;
            return animeID;
        } catch (e) {
            console.log(e);
            throw new Error("wrong_id")
        }
    }



    async getMediaListEntryByAnimeID(animeId, token) {
        const query = `mutation ($mediaId: Int, $status: MediaListStatus) {
            SaveMediaListEntry (mediaId: $mediaId, status: $status) {
                id
                status
            }
        }`;

        const variables = {
            "mediaId": animeId,
            "status": "CURRENT"
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': "Bearer " + token,
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        }
        console.log("fetching mediaList...");

        let response, json;

        try {
            response = await fetch(this.url, options);
        } catch (e) {
            //wrong token 
            console.log(e);
            throw new Error("wrong_token")
        }

        try {
            json = await response.json();
            return json.data.SaveMediaListEntry.id
        } catch (e) {
            console.log(e);
            throw new Error("wrong_json")
        }
    }



    async updateMediaList(animeID, mediaListID, episode, token){
        const query = `mutation ($id: Int, $mediaId: Int, $progress: Int) {
            SaveMediaListEntry (id: $id, mediaId: $mediaId, progress: $progress) {
                id
            }
        }`;

        const variables = {
            "id": mediaListID,
            "mediaId": animeID,
            "progress": episode,
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': "Bearer " + token,
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        }
        console.log("updating media list...");

        let response, json;
        try {
            response = await fetch(this.url, options);
        } catch (e) {
            //wrong token 
            console.log(e);
            throw new Error("wrong_token")
        }

        try {
            json = await response.json();
            return json.data.SaveMediaListEntry.id
        } catch (e) {
            console.log(e);
            throw new Error("wrong_json")
        }
        
    }
}