const { default: axios } = require('axios');
const fs = require("fs")
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { DISCORD_TOKEN, TWITCH_CLIENT_ID, TWITCH_SCRECT_ID, CHANNEL_ID } = require('./config.json');
const moment = require('moment/moment');
const { last_stream_date } = require("./data.json");

let accessToken = null;
let lastStremDate = last_stream_date;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.login(DISCORD_TOKEN);

client.commands = new Collection();

const loadToken = async () => {
	const accessTokenRes = await axios({
		url: `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_SCRECT_ID}&grant_type=client_credentials`,
    method: 'POST',
	})
	accessToken = accessTokenRes.data.access_token;
}

const loadStream = async () => {
	const streamRes = await axios({
		url: 'https://api.twitch.tv/helix/streams?user_login=niryu1207',
    method: 'get',
		headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Accept': 'application/vnd.twitchtv.v5+json',
      'Authorization': 'Bearer ' + accessToken
    }
	});
	const currentData = streamRes.data.data?.[0];
	const streamDate = moment(currentData?.started_at).format("YYYY-MM-DD hh:mm:ss");
	if (currentData && streamRes.data.data?.length > 0 && (lastStremDate < streamDate || lastStremDate == null)) {
		const channel = client.channels.cache.get(CHANNEL_ID);
		channel.send({
			content: `
📢 니류짱 방송시작! 📢
	
많이 많이 와주세요!
	
https://www.twitch.tv/niryu1207
`,
		});
		const data = {
			last_stream_date: streamDate
		}
		lastStremDate = streamDate;
		fs.writeFileSync("./data.json", JSON.stringify(data), "utf8")
	}
}

const setup = async () => {
	await loadToken();
	await loadStream();
}


client.on(Events.ClientReady, async interaction => {
	await setup();
	setInterval(loadStream, 5000);
});