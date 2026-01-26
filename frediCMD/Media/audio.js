const axios = require("axios");

module.exports = {
  name: 'audio',
  aliases: ['spotifydl', 'sdl', 'spotify'],
  description: 'Download Spotify songs in selected format',
  run: async (context) => {
    const { client, m, text, prefix } = context;

    try {
      if (!text) return m.reply("Usage: *sp [type] [url/query]*\nExample: *sp audio_mp3 https://spotify.com/...*");

      const args = text.split(' ');
      if (args.length < 2) return m.reply("Invalid format. Use: *sp [type] [url/query]*");

      const type = args[0].toLowerCase();
      const query = args.slice(1).join(' ');

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      // Use the Spotify API endpoint
      const response = await axios.get(`https://api.ootaizumi.web.id/downloader/spotifyplay?query=${encodeURIComponent(query)}`);
      const data = response.data;

      if (!data.status || !data.result) {
        throw new Error("API returned no valid data");
      }

      const song = data.result;
      const audioUrl = song.download;
      const filename = song.title || "Unknown Song";
      const artist = song.artists || "Unknown Artist";
      const thumbnail = song.image || "";

      if (!audioUrl) {
        throw new Error("No download URL found");
      }

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

      // Prepare filename
      const sanitizeFilename = (name) => {
        return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
      };

      const safeTitle = sanitizeFilename(filename);
      const finalFilename = `${safeTitle}.mp3`;
      
      const caption = `🎵 *${safeTitle}*\n👤 *Artist:* ${artist}\n🔗 *Downloaded via:* 𝙁𝙀𝙀-𝙓𝙈𝘿`;

      // Helper function to safely substring
      const safeSubstring = (str, length) => {
        if (!str || typeof str !== 'string') return "";
        return str.substring(0, Math.min(str.length, length));
      };

      // Send media based on type
      switch(type) {
        case 'audio_mp3':
          // Send as audio message
          await client.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: finalFilename,
            contextInfo: {
              externalAdReply: {
                title: safeSubstring(safeTitle, 30),
                body: safeSubstring(artist, 30),
                thumbnailUrl: thumbnail,
                sourceUrl: query.includes('spotify.com') ? query : "",
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          }, { quoted: m });
          break;

        case 'audio_doc':
          // Send as audio document
          await client.sendMessage(m.chat, {
            document: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: finalFilename,
            caption: caption
          }, { quoted: m });
          break;

        default:
          // Default to audio MP3
          await client.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: finalFilename,
            caption: caption
          }, { quoted: m });
      }

    } catch (error) {
      console.error('Spotify download error:', error);
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      await m.reply(`Spotify download failed. Please try again.\nError: ${error.message}`);
    }
  }
};