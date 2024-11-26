import { DiscordSDK } from "@discord/embedded-app-sdk";
import rocketLogo from '/rocket.png';
import "./style.css";

let auth;
const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

async function appendUserAvatar() {
  const app = document.querySelector('#app');
  if (!app) throw new Error("Element with ID #app not found.");

  // 1. Récupérer les informations de l'utilisateur connecté via l'API Discord
  const user = await fetch(`https://discord.com/api/v10/users/@me`, {
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());

  // 2. Construire l'URL de l'avatar de l'utilisateur
  if (user && user.avatar) {
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;

    // 3. Ajouter l'avatar à l'interface utilisateur
    const userAvatar = document.createElement('img');
    userAvatar.setAttribute('src', avatarUrl);
    userAvatar.setAttribute('width', '128px');
    userAvatar.setAttribute('height', '128px');
    userAvatar.style.borderRadius = '50%';

    const userName = document.createElement('p');
    userName.textContent = `Hello, ${user.username}#${user.discriminator}!`;

    app.appendChild(userAvatar);
    app.appendChild(userName);
  } else {
    const errorText = document.createElement('p');
    errorText.textContent = "Failed to fetch user avatar.";
    app.appendChild(errorText);
  }
}

async function appendVoiceChannelName() {
  const app = document.querySelector('#app');
  if (!app) throw new Error("Element with ID #app not found.");

  let activityChannelName = 'Unknown';
  if (discordSdk.channelId && discordSdk.guildId) {
    const channel = await discordSdk.commands.getChannel({ channel_id: discordSdk.channelId });
    if (channel.name) activityChannelName = channel.name;
  }

  const textTag = document.createElement('p');
  textTag.textContent = `Activity Channel: "${activityChannelName}"`;
  app.appendChild(textTag);
}

async function appendGuildAvatar() {
  const app = document.querySelector('#app');
  if (!app) throw new Error("Element with ID #app not found.");

  const guilds = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());

  const currentGuild = guilds.find((g) => g.id === discordSdk.guildId);
  if (currentGuild) {
    const guildImg = document.createElement('img');
    guildImg.setAttribute('src', `https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`);
    guildImg.setAttribute('width', '128px');
    guildImg.setAttribute('height', '128px');
    guildImg.style.borderRadius = '50%';
    app.appendChild(guildImg);
  }
}

async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord SDK is ready");

  // Authorize with Discord Client
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: ["identify", "guilds", "applications.commands"],
  });

  // Retrieve an access_token from your activity's server
  const response = await fetch("/.proxy/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const { access_token } = await response.json();
  auth = await discordSdk.commands.authenticate({ access_token });
  if (!auth) throw new Error("Authenticate command failed");

  console.log("Discord SDK is authenticated");
}

document.querySelector('#app').innerHTML = `
  <div>
    <img src="${rocketLogo}" class="logo" alt="Discord" />
    <h1>Discord User Info</h1>
  </div>
`;

setupDiscordSdk().then(() => {
  appendUserAvatar(); // Affiche l'avatar de l'utilisateur connecté
  appendVoiceChannelName();
  appendGuildAvatar();
});
