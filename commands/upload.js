const Discord = require("discord.js");
const validUrl = require("valid-url");
const { downloading, loading } = require("../data/emojis.json");
const { invisible } = require("../data/colors.json");
const { posts } = require("../data/channels.json");
const replies = require("../data/replies.json");
const prePost = require("../models/post.js");
const mongoose = require("mongoose");
const mongoUrl = require("../tokens.json").mongodb;
const db = require("quick.db");

mongoose.connect(mongoUrl, {
  useNewUrlParser: true
});

module.exports = {
  name: "upload",
  description: "Uploads your meme to the database",
  usage: "<image>",
  cooldown: "120",
  async execute (client, message, args) {
    
    if (client.memes.length > 39) return message.channel.send("Already 40 memes queued for verification. Plesse wait for them to be verified by a moderator or an administrator first.");
    
    const msg = await message.channel.send(`${downloading} Uploading to database...`);

    try {
      let img;
      if (!args[0]) {
        if (!message.attachments.first()) return msg.edit(`You didn't provide any arguments ${message.author.mention}.\nCorrect Usage: \`Wii upload <image>\``);
        img = message.attachments.first().url;
        if (!img) return msg.edit(`You didn't provide any arguments ${message.author.mention}.\nCorrect Usage: \`Wii upload <image>\``);
      
      } else if (validUrl.isUri(args[0])) {
        img = args[0];
      } else {
        return msg.edit(`That was not a valid url ${message.author.mention}.\nCorrect Usage: \`Wii upload <image>\``);
      }

      if (!img) return msg.edit(replies.noImg);

      const docCount = await prePost.countDocuments();

      const id = docCount + 1;

      const post = new prePost({
        id: id,
        authorID: message.author.id,
        uploadedAt: message.createdTimestamp,
        url: img,
        upVotes: 0,
        downVotes: 0,
        approvedBy: "NONE",
        state: "POST_UNAPPROVED",
        votes: []
      });

      await post.save().catch(e => console.log(e));
      client.memes.push(message.author.id);

      const embed = new Discord.RichEmbed()
        .setAuthor(message.author.username, message.author.displayAvatarURL)
        .setDescription(`Successfully uploaded image to database!\n${loading} Waiting for approval from a moderator.`)
        .setFooter("This system is in place to make sure images posted follow our guidelines.")
        .setTimestamp()
        .setColor(invisible);
      msg.edit(embed);
        
      const log = new Discord.RichEmbed()
        .setAuthor(`Posted by ${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL)
        .setDescription(`ID \`#${id}\``)
        .setImage(img)
        .setColor(invisible)
        .setFooter("Awaiting for approval.")
        .setTimestamp();
      client.channels.get(posts).send(log);
      db.add(`uploadedMemes.${client.user.id}`, 1);

    } catch (error) {
      console.log(error);
      msg.edit("An error occured while uploading image to database! Please make sure you are uploading an image/gif/video, and not something else.");
    }
  },
};
