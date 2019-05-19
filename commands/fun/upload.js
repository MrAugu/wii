const Discord = require("discord.js");
const validUrl = require("valid-url");
const { downloading, loading } = require("../../data/emojis.json");
const { invisible } = require("../../data/colors.json");
const { posts } = require("../../data/channels.json");
const { images, videos } = require("../../data/extensions.json");
const replies = require("../../data/replies.json");
const prePost = require("../../models/post.js");
const mongoose = require("mongoose");
const mongoUrl = require("../../tokens.json").mongodb;
const db = require("quick.db");

mongoose.connect(mongoUrl, {
  useNewUrlParser: true
});

module.exports = {
  name: "upload",
  description: "Uploads your meme to the database",
  usage: "<image> <title>",
  cooldown: "120",
  async execute (client, message, args) {
    //if (client.memes.length >= 50) return message.channel.send("Already 40 memes queued for verification. Plesse wait for them to be verified by a moderator or an administrator first.");
    const msg = await message.channel.send(`${downloading} Uploading to database...`);

    try {
      let attach;
      let titlePost;
      let fileExtension;

      if (!message.attachments.first()) {
        if (args[0] && validUrl.isUri(args[0])) {
          attach = args[0];
          let fileName = attach.filename;
          if (args[1]) {
            titlePost = args.slice(1).join(" "); 
            fileExtension = args[0].substring(attach.lastIndexOf("."));
          } else {
            fileExtension = attach.substring(attach.lastIndexOf("."));
          }
          message.channel.send(fileExtension);
        } else {
          return msg.edit(`That was not a valid url ${message.author.mention}.\nCorrect Usage: \`${client.settings.pre}upload <image>\``);
        }
      } else {
        attach = message.attachments.first().url;
        if (!attach) return msg.edit(`You didn't provide any arguments ${message.author.mention}.\nCorrect Usage: \`#${client.settings.pre}upload <image>\``);
        if (args[0]) titlePost = args.join(" ");

        const a = message.attachments.first();
        let filename = a.filename;
        fileExtension = filename.substring(filename.lastIndexOf("."));

      }

      if (!attach) return msg.edit(replies.noImg);

      const docCount = await prePost.countDocuments();
      const id = docCount + 1;
      if (titlePost === null || titlePost === undefined) titlePost = "Untitled";

      if(videos.includes(fileExtension)) {
        const post = new prePost({
          id: id,
          title: titlePost, 
          authorID: message.author.id,
          uploadedAt: message.createdTimestamp,
          url: attach,
          upVotes: 0,
          downVotes: 0,
          approvedBy: "NONE",
          state: "POST_UNAPPROVED",
          votes: [],
          reports: 0,
          type: "vid",
        });
        await post.save().catch(e => console.log(e));
      } else {
        const post = new prePost({
          id: id,
          title: titlePost, 
          authorID: message.author.id,
          uploadedAt: message.createdTimestamp,
          url: attach,
          upVotes: 0,
          downVotes: 0,
          approvedBy: "NONE",
          state: "POST_UNAPPROVED",
          votes: [],
          reports: 0,
          type: "img",
        });
        await post.save().catch(e => console.log(e));
      } 

      client.memes.push(message.author.id);

      const embed = new Discord.RichEmbed()
        .setAuthor(`${message.author.username} - <#${id}>`, message.author.displayAvatarURL)
        .setDescription(`Successfully uploaded image to database!\n${loading} Waiting for approval from a moderator.`)
        .setFooter("This system is in place to make sure images posted follow our guidelines.")
        .setTimestamp()
        .setColor(invisible);
      msg.edit(embed);
        
      if(videos.includes(fileExtension)) {
        const memeAttachment = new Discord.Attachment(attach);
        const vidString = 
`**Posted by ${message.author.tag} (${message.author.id})**
\`<#${id}>\` | ${titlePost}
Awaiting for approval.
`;
        client.channels.get(posts).send(vidString, memeAttachment);
      } else {
        const log = new Discord.RichEmbed()
        .setAuthor(`Posted by ${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL)
        .setTitle(titlePost)
        .setDescription(`\`<#${id}>\``)
        .setImage(attach)
        .setColor(invisible)
        .setFooter("Awaiting for approval.")
        .setTimestamp();
        client.channels.get(posts).send(log);
      } 

      db.add(`uploadedMemes.${client.user.id}`, 1);

    } catch (error) {
      console.log(error);
      return msg.edit("An error occured while uploading image to database! Please make sure you are uploading an image, gif, or video, and not something else.");
    }
  },
};
