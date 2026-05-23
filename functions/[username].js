export async function onRequest(context) {
    const { env, params } = context;
    const username = params.username.toLowerCase();

    // Database se data nikalna
    const res = await env.DB.prepare("SELECT * FROM biographies WHERE username = ?").bind(username).first();

    if (!res) {
        return new Response(`
            <h1 style="font-family:sans-serif; text-align:center; margin-top:50px;">
                404 Not Found 💔<br><small style="color:gray;">Is URL par koi profile nahi mili.</small>
            </h1>
        `, { status: 404, headers: { "Content-Type": "text/html" } });
    }

    const defaultPic = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
    const profilePic = res.profile_pic_url || defaultPic;
    const formattedBio = res.bio_text ? res.bio_text.replace(/\n/g, '<br><br>') : '';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>${res.full_name} - Wikipedia</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Lato, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #eaecf0; color: #202122; line-height: 1.6; }
            .wiki-header { background: #fff; padding: 10px 20px; border-bottom: 1px solid #a2a9b1; display: flex; align-items: center; gap: 10px; }
            .wiki-header img { width: 35px; }
            .wiki-header span { font-family: 'Linux Libertine', 'Georgia', Times, serif; font-size: 20px; }
            .container { max-width: 960px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #a7d7f9; border-top: none; min-height: 100vh; }
            h1 { font-family: 'Linux Libertine', 'Georgia', Times, serif; font-weight: normal; font-size: 2.2em; margin-top: 0; margin-bottom: 5px; border-bottom: 1px solid #a2a9b1; padding-bottom: 5px; }
            .infobox { float: right; clear: right; width: 300px; background-color: #f8f9fa; border: 1px solid #a2a9b1; margin: 0.5em 0 1em 1.5em; padding: 5px; font-size: 0.85em; }
            .infobox th.main-header { background-color: #b0c4de; text-align: center; font-size: 1.2em; padding: 8px; }
            .infobox img { width: 100%; height: auto; display: block; margin-bottom: 5px; }
            .infobox table { width: 100%; border-collapse: collapse; }
            .infobox th, .infobox td { padding: 6px; border-top: 1px solid #eaecf0; vertical-align: top; }
            .infobox th { text-align: left; white-space: nowrap; color: #202122; width: 35%; }
            .infobox td { color: #202122; }
            a { color: #0645ad; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .content p { font-size: 0.95em; margin-bottom: 15px; }
            @media (max-width: 768px) {
                .container { padding: 15px; border: none; }
                .infobox { float: none; width: 100%; margin: 0 0 20px 0; }
            }
        </style>
    </head>
    <body>
        <div class="wiki-header">
            <img src="https://upload.wikimedia.org/wikipedia/commons/d/de/Wikipedia_Logo_1.0.png" alt="Wikipedia">
            <span>WIKIPEDIA</span>
        </div>
        <div class="container">
            <h1>${res.full_name}</h1>
            <div class="infobox">
                <th class="main-header" style="display:block;">${res.full_name}</th>
                <img src="${profilePic}" alt="${res.full_name}">
                <table>
                    ${res.profession ? `<tr><th>Occupation</th><td>${res.profession}</td></tr>` : ''}
                    ${res.dob ? `<tr><th>Born</th><td>${res.dob}</td></tr>` : ''}
                    ${res.instagram ? `<tr><th>Instagram</th><td><a href="${res.instagram}" target="_blank">@${res.instagram.split('/').pop() || 'Profile'}</a></td></tr>` : ''}
                    ${res.linkedin ? `<tr><th>LinkedIn</th><td><a href="${res.linkedin}" target="_blank">View Profile</a></td></tr>` : ''}
                </table>
            </div>
            <div class="content">
                <p><b>${res.full_name}</b> is an Indian ${res.profession ? res.profession.toLowerCase() : 'professional'}. ${formattedBio}</p>
            </div>
            <div style="clear: both;"></div>
        </div>
    </body>
    </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html" } });
}
