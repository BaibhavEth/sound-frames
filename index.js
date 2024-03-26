const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.post("/submit", async (req, res) => {
  const { url } = req.body;

  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    let imgSrc = "";
    $("img").each(function () {
      const src = $(this).attr("src");
      if (src && !imgSrc) {
        imgSrc = new URL(src, url).href;
      }
    });

    // Extract artist and song name from URL
    const match = url.match(/https:\/\/www\.sound\.xyz\/([^\/]+)\/([^?]+)/);
    let artist = match ? match[1] : null;
    let songName = match ? match[2].replace(/-/g, " ") : null;

    if (artist && songName) {
      artist = artist.toLowerCase().replace(/\s+/g, ""); // Sanitize the artist name to be folder-friendly
      songName = songName.toLowerCase().replace(/\s+/g, ""); // Sanitize the song name to be file-friendly

      const artistDir = path.join(__dirname, "public", artist);
      const songFile = path.join(artistDir, `${songName}.html`);

      if (!fs.existsSync(artistDir)) {
        fs.mkdirSync(artistDir, { recursive: true });
      }

      // Check if the song file already exists
      if (fs.existsSync(songFile)) {
        // If exists, redirect to it
        return res.redirect(`/${artist}/${songName}.html`);
      }

      // If not, create a new HTML file
      const newPageContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link href="https://cdn.tailwindcss.com" rel="stylesheet">
              <title>Frame Created</title>
              <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp"></script>
              <meta name="og:image" content="${imgSrc}"/>
        <meta name="fc:frame" content="vNext"/>
        <!-- If needing to reset or indicate no image, you might leave this empty or follow specific instructions provided for the 'undefined' requirement -->
        <meta name="fc:frame:image" content="${imgSrc}"/>
        <meta name="fc:frame:post_url" content="https://09d0b42e-b720-4db4-ba45-f1eedf68f1aa-00-truf13s5vy3d.worf.replit.dev/newpage.html"/>
        <meta name="fc:frame:image:aspect_ratio" content="1:1"/>
        <meta name="fc:frame:button:1" content="Check out ${artist}"/>
        <meta name="fc:frame:button:1:action" content="link"/>
        <meta name="fc:frame:button:1:target" content="https://www.sound.xyz/${artist}/releases"/>

        <meta name="fc:frame:button:2" content="Play ${songName}"/>
        <meta name="fc:frame:button:2:action" content="link"/>
        <meta name="fc:frame:button:2:target" content="${url}"/>


        <meta name="og:title" content="Submission Received"/>

              <script>
                  // Function to copy the URL to the clipboard
                  function copyToClipboard() {
                      const el = document.createElement('textarea');
                      el.value = "https://09d0b42e-b720-4db4-ba45-f1eedf68f1aa-00-truf13s5vy3d.worf.replit.dev/${artist}/${songName}.html"; // Get the current page URL
                      document.body.appendChild(el);
                      el.select();
                      document.execCommand('copy');
                      document.body.removeChild(el);
                  }
              </script>
          </head>
          <body class="bg-gray-100 flex flex-col items-center justify-center min-h-screen">
              <div class="bg-white p-8 border border-gray-300 rounded-lg shadow-lg max-w-lg mx-auto">
                  <h1 class="text-xl font-bold mb-4 text-center">Frame Created</h1>
                  <div class="text-center mb-4">
                      <p class="text-lg font-semibold">${artist}</p>
                      <p class="text-gray-600">${songName}</p>
                  </div>
                  <img src="${imgSrc}" alt="Artist Image" class="my-4 w-auto max-w-xs rounded-md shadow">
                  <button onclick="copyToClipboard()" class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                      Copy URL
                  </button>
                  <div class="mt-4 p-3 bg-blue-100 text-blue-800 text-sm rounded border border-blue-400">
                      <p>Share this frame:</p>

                  </div>
              </div>
          </body>
          </html>
          `;

      fs.writeFileSync(songFile, newPageContent);
      res.redirect(`/${artist}/${songName}.html`);
    } else {
      res
        .status(400)
        .send("Invalid URL: Unable to extract artist and song name");
    }
  } catch (error) {
    console.error("Error fetching image: ", error);
    res.status(500).send("Error processing your request");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
