const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
} = require("discord.js");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const REQUIRED_SERVER_ID = "1245354780507770962";
const REQUIRED_RANK = "Owner";
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = REQUIRED_SERVER_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

async function sendLogMessage(content) {
  await fetch(WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify({ content }),
    headers: { "Content-Type": "application/json" },
  });
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.guild.id !== REQUIRED_SERVER_ID) {
    return interaction.reply({
      content: "Command not allowed on this server.",
      ephemeral: true,
    });
  }

  const user = await interaction.guild.members.fetch(interaction.user.id);
  if (user.roles.cache.some((role) => role.name === REQUIRED_RANK)) {
    if (interaction.isCommand()) {
      const userId = interaction.options.getString("id");
      const reason =
        interaction.options.getString("reason") || "No reason provided";
      const executorTag = interaction.user.tag;

      if (interaction.commandName === "banp") {
        try {
          const userToBan = await interaction.guild.members.fetch(userId);
          if (!userToBan) {
            return interaction.reply({
              content: "User not found.",
              ephemeral: true,
            });
          }

          const connection = await getConnection();
          await connection.execute(
            "UPDATE users SET banned = 1, ban_reason = ? WHERE discord_id = ?",
            [reason, userId]
          );
          connection.end();

          const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("You have been banned")
            .setDescription(
              `You have been banned from the site.\n**Reason**: ${reason}`
            )
            .setThumbnail("https://cdn.discordapp.com/embed/avatars/0.png")
            .setFooter({
              text: "Contact an administrator for more information.",
            });

          await userToBan.send({ embeds: [embed] });
          const logMessage = `User ${userToBan.user.tag} (${userId}) was banned by ${executorTag} for: ${reason}`;
          await sendLogMessage(logMessage);
          interaction.reply({ content: logMessage, ephemeral: true });
        } catch (error) {
          console.error("Error banning user:", error);
          interaction.reply({
            content: "An error occurred while banning the user.",
            ephemeral: true,
          });
        }
      }

      if (interaction.commandName === "unbanp") {
        try {
          const userToUnban = await interaction.guild.members.fetch(userId);
          if (!userToUnban) {
            return interaction.reply({
              content: "User not found.",
              ephemeral: true,
            });
          }

          const connection = await getConnection();
          await connection.execute(
            "UPDATE users SET banned = 0 WHERE discord_id = ?",
            [userId]
          );
          connection.end();

          const embed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("You have been unbanned")
            .setDescription("You have been unbanned from the site.")
            .setThumbnail("https://cdn.discordapp.com/embed/avatars/0.png")
            .setFooter({
              text: "Contact an administrator for more information.",
            });

          await userToUnban.send({ embeds: [embed] });
          const logMessage = `User ${userToUnban.user.tag} (${userId}) was unbanned by ${executorTag}.`;
          await sendLogMessage(logMessage);
          interaction.reply({ content: logMessage, ephemeral: true });
        } catch (error) {
          console.error("Error unbanning user:", error);
          interaction.reply({
            content: "An error occurred while unbanning the user.",
            ephemeral: true,
          });
        }
      }

      if (interaction.commandName === "banall") {
        try {
          const userToBan = await interaction.guild.members.fetch(userId);
          if (!userToBan) {
            return interaction.reply({
              content: "User not found.",
              ephemeral: true,
            });
          }

          const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("You have been banned")
            .setDescription(
              `You have been banned from all LoveStresser services.\n**Reason**: ${reason}`
            )
            .setThumbnail("https://cdn.discordapp.com/embed/avatars/0.png")
            .setFooter({
              text: "Contact an administrator for more information.",
            });

          await userToBan.send({ embeds: [embed] });

          setTimeout(async () => {
            try {
              await userToBan.ban({ reason });

              const connection = await getConnection();
              await connection.execute(
                "UPDATE users SET banned = 1, ban_reason = ? WHERE discord_id = ?",
                [reason, userId]
              );
              connection.end();

              const logMessage = `User ${userToBan.user.tag} (${userId}) was banned from all services by ${executorTag} for: ${reason}`;
              await sendLogMessage(logMessage);
              interaction.reply({ content: logMessage, ephemeral: true });
            } catch (banError) {
              console.error("Error banning user:", banError);
              interaction.reply({
                content: "An error occurred while banning the user.",
                ephemeral: true,
              });
            }
          }, 1000);
        } catch (error) {
          console.error("Error sending DM or banning user:", error);
          interaction.reply({
            content:
              "An error occurred while sending the DM or banning the user.",
            ephemeral: true,
          });
        }
      }

      if (interaction.commandName === "unbanall") {
        try {
          await interaction.guild.bans.remove(userId);

          const connection = await getConnection();
          await connection.execute(
            "UPDATE users SET banned = 0 WHERE discord_id = ?",
            [userId]
          );
          connection.end();

          const logMessage = `User ${userId} was unbanned from all services by ${executorTag}.`;
          await sendLogMessage(logMessage);
          interaction.reply({ content: logMessage, ephemeral: true });
        } catch (error) {
          console.error("Error unbanning user:", error);
          interaction.reply({
            content: "An error occurred while unbanning the user.",
            ephemeral: true,
          });
        }
      }

      if (interaction.commandName === "view") {
        try {
          const connection = await getConnection();
          const [rows] = await connection.execute(
            "SELECT * FROM users WHERE discord_id = ?",
            [userId]
          );

          if (rows.length === 0) {
            return interaction.reply({
              content: "Utilisateur introuvable.",
              ephemeral: true,
            });
          }

          const user = rows[0];
          const embed = new EmbedBuilder()
            .setColor("#aa1331")
            .setTitle(`@${user.discord_id}`)
            .setThumbnail(
              user.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"
            )
            .setAuthor({
              name: "LoveAPI",
              iconURL:
                "https://media.discordapp.net/attachments/1264904496480518226/1264945517566361600/Design_sans_titre.png?ex=669fb7d0&is=669e6650&hm=ea3e495e1bcf6618cdb1cf24340e9c1f4ce5abf7fc23bb214a09ee57a4ca08ac&=&format=webp&quality=lossless",
              url: "https://love-stresser.me",
            })
            .setDescription(
              `**Informations**\n\n` +
                `**ID :** \`${user.id}\`\n` +
                `▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n` +
                `**DISCORD ID :** \`${user.discord_id}\`\n` +
                `▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n` +
                `**Username :** \`${user.username}\`\n` +
                `▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n` +
                `**Email :** \`${user.email}\`\n` +
                `▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n` +
                `**Grâde :** \`${user.rank}\`\n` +
                `▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n` +
                `**Crée le :** \`${
                  user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Non défini"
                }\`\n` +
                `▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n` +
                `**Mis à jour le :** \`${
                  user.updated_at
                    ? new Date(user.updated_at).toLocaleDateString()
                    : "Non défini"
                }\`\n` +
                `▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n` +
                `**Plan :** \`${user.plan}\`\n` +
                `▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁\n\n` +
                `**IP :** \`${user.ip || "Non défini"}\``
            )
            .setFooter({
              text: `Informations sur l'utilisateur @${user.discord_id} à partir de la base de données.`,
            });

          const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`banp:${user.discord_id}`)
              .setLabel("Ban-Panel")
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`unbanp:${user.discord_id}`)
              .setLabel("Unban-Panel")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`banall:${user.discord_id}`)
              .setLabel("Ban-ALL")
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`unbanall:${user.discord_id}`)
              .setLabel("Unban-ALL")
              .setStyle(ButtonStyle.Success)
          );

          connection.end();
          interaction.reply({ embeds: [embed], components: [actionRow] });
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des informations de l'utilisateur :",
            error
          );
          interaction.reply({
            content:
              "Une erreur est survenue lors de la récupération des informations.",
            ephemeral: true,
          });
        }
      }
    }

    if (interaction.isButton()) {
      const [action, id] = interaction.customId.split(":");
      const reason = "Aucune raison fournie";

      if (action === "banp") {
        try {
          const user = await interaction.guild.members.fetch(id);
          if (!user) {
            return interaction.reply({
              content: "Utilisateur introuvable.",
              ephemeral: true,
            });
          }

          const connection = await getConnection();
          await connection.execute(
            "UPDATE users SET banned = 1 WHERE discord_id = ?",
            [id]
          );
          connection.end();

          const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("Vous avez été banni")
            .setDescription(
              `Vous avez été banni du site.\n**Raison**: ${reason}`
            )
            .setFooter({
              text: "Contactez un administrateur pour plus d'informations.",
            });

          await user.send({ embeds: [embed] });
          const logMessage = `L'utilisateur ${user.user.tag} (${id}) a été banni par ${interaction.user.tag} pour la raison : ${reason}`;
          await sendLogMessage(logMessage);
          interaction.reply({ content: logMessage, ephemeral: true });
        } catch (error) {
          console.error("Erreur lors du bannissement :", error);
          interaction.reply({
            content: "Une erreur est survenue lors du bannissement.",
            ephemeral: true,
          });
        }
      }

      if (action === "unbanp") {
        try {
          const user = await interaction.guild.members.fetch(id);
          if (!user) {
            return interaction.reply({
              content: "Utilisateur introuvable.",
              ephemeral: true,
            });
          }

          const connection = await getConnection();
          await connection.execute(
            "UPDATE users SET banned = 0 WHERE discord_id = ?",
            [id]
          );
          connection.end();

          const logMessage = `L'utilisateur ${user.user.tag} (${id}) a été débanni par ${interaction.user.tag}.`;
          await sendLogMessage(logMessage);
          interaction.reply({ content: logMessage, ephemeral: true });
        } catch (error) {
          console.error("Erreur lors du débannissement :", error);
          interaction.reply({
            content: "Une erreur est survenue lors du débannissement.",
            ephemeral: true,
          });
        }
      }

      if (action === "banall") {
        try {
          const user = await interaction.guild.members.fetch(id);
          if (!user) {
            return interaction.reply({
              content: "Utilisateur introuvable.",
              ephemeral: true,
            });
          }

          const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("Vous avez été banni")
            .setDescription(
              `Vous avez été banni de tous les services de LoveStresser.\n**Raison**: ${reason}`
            )
            .setFooter({
              text: "Contactez un administrateur pour plus d'informations.",
            });

          await user.send({ embeds: [embed] });

          setTimeout(async () => {
            try {
              await user.ban({ reason });

              const connection = await getConnection();
              await connection.execute(
                "UPDATE users SET banned = 1 WHERE discord_id = ?",
                [id]
              );
              connection.end();

              const logMessage = `L'utilisateur ${user.user.tag} (${id}) a été banni de tout par ${interaction.user.tag} pour la raison : ${reason}`;
              await sendLogMessage(logMessage);
              interaction.reply({ content: logMessage, ephemeral: true });
            } catch (banError) {
              console.error(
                "Erreur lors du bannissement de l'utilisateur :",
                banError
              );
              interaction.reply({
                content:
                  "Une erreur est survenue lors du bannissement de l'utilisateur.",
                ephemeral: true,
              });
            }
          }, 1000);
        } catch (error) {
          console.error(
            "Erreur lors de l'envoi du message privé ou du bannissement :",
            error
          );
          interaction.reply({
            content:
              "Une erreur est survenue lors de l'envoi du message privé ou du bannissement.",
            ephemeral: true,
          });
        }
      }

      if (action === "unbanall") {
        try {
          await interaction.guild.bans.remove(id);

          const connection = await getConnection();
          await connection.execute(
            "UPDATE users SET banned = 0 WHERE discord_id = ?",
            [id]
          );
          connection.end();

          const logMessage = `L'utilisateur ${id} a été débanni de tout par ${interaction.user.tag}.`;
          await sendLogMessage(logMessage);
          interaction.reply({ content: logMessage, ephemeral: true });
        } catch (error) {
          console.error("Erreur lors du débannissement :", error);
          interaction.reply({
            content: "Une erreur est survenue lors du débannissement.",
            ephemeral: true,
          });
        }
      }
    }
  }
  if (!user.roles.cache.some((role) => role.name === REQUIRED_RANK)) {
    return interaction.reply({
      content: "Vous n'avez pas la permission d'exécuter cette commande.",
      ephemeral: true,
    });
  }
});

client.on("guildMemberAdd", async (member) => {
  if (member.guild.id !== REQUIRED_SERVER_ID) return;

  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      "SELECT banned FROM users WHERE discord_id = ?",
      [member.id]
    );

    if (rows.length > 0 && rows[0].banned) {
      await member.send("You are banned and cannot rejoin the server.");
      await member.kick("User is banned in the database.");
    }

    connection.end();
  } catch (error) {
    console.error("Error checking user ban status:", error);
  }
});

client.on("guildMemberRemove", async (member) => {
  if (member.guild.id !== REQUIRED_SERVER_ID) return;

  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      "SELECT banned FROM users WHERE discord_id = ?",
      [member.id]
    );

    if (rows.length > 0 && rows[0].banned) {
      await member.send("You have been banned from the server.");
    }

    connection.end();
  } catch (error) {
    console.error("Error checking user ban status:", error);
  }
});

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: [
        {
          name: "banp",
          description: "Ban a user on the site",
          options: [
            {
              name: "id",
              description: "User ID",
              type: 3,
              required: true,
            },
            {
              name: "reason",
              description: "Reason for the ban",
              type: 3,
              required: false,
            },
          ],
        },
        {
          name: "unbanp",
          description: "Unban a user on the site",
          options: [
            {
              name: "id",
              description: "User ID",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "banall",
          description: "Ban a user on the site and from the Discord server",
          options: [
            {
              name: "id",
              description: "User ID",
              type: 3,
              required: true,
            },
            {
              name: "reason",
              description: "Reason for the ban",
              type: 3,
              required: false,
            },
          ],
        },
        {
          name: "unbanall",
          description: "Unban a user on the site and from the Discord server",
          options: [
            {
              name: "id",
              description: "User ID",
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: "view",
          description: "View a user's profile",
          options: [
            {
              name: "id",
              description: "User ID",
              type: 3,
              required: true,
            },
          ],
        },
      ],
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

client.login(TOKEN);
