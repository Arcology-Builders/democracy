const sdk = require('matrix-js-sdk')

/*
// Uncomment this to find the access token if you've forgotten it
const client = sdk.createClient("https://cryptogoth.arcology.nyc");
client.login("m.login.password", {"user": "zk/0xd1e3E7825e0451EF12F9063Eb597ed2b62e543Ae", "password": "guest"}).then((response) => {
    console.log(response.access_token);
});
*/
ACCESS_TOKEN="MDAyNWxvY2F0aW9uIGNyeXB0b2dvdGguYXJjb2xvZ3kubnljCjAwMTNpZGVudGlmaWVyIGtleQowMDEwY2lkIGdlbiA9IDEKMDA1OWNpZCB1c2VyX2lkID0gQHprLzB4ZDFlM2U3ODI1ZTA0NTFlZjEyZjkwNjNlYjU5N2VkMmI2MmU1NDNhZTpjcnlwdG9nb3RoLmFyY29sb2d5Lm55YwowMDE2Y2lkIHR5cGUgPSBhY2Nlc3MKMDAyMWNpZCBub25jZSA9IFVXbFleTTUudTE3d0pFT18KMDAyZnNpZ25hdHVyZSDOyZsY-zWiYOXqkZtlgpLq3SLtnlsF2BSiJtaTIIe8yAo"
BASE_URL="https://cryptogoth.arcology.nyc"
USER_ID="@zk/0xd1e3E7825e0451EF12F9063Eb597ed2b62e543Ae:cryptogoth.arcology.nyc"

const client = sdk.createClient({
    baseUrl: BASE_URL,
    accessToken: ACCESS_TOKEN,
    userId: USER_ID,
})

client.once('sync', function(state, prevState, res) {
    console.log(state); // state will be 'PREPARED' when the client is ready to use
});

const rooms = client.getRooms();
rooms.forEach(room => {
    console.log(JSON.stringify(room), room.roomId);
});

//client.startClient();