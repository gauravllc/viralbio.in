export async function onRequest(context) {
    const { env, params } = context;
    const username = params.username.toLowerCase();

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
    const shortBio = res.short_bio ? res.short_bio : '';
    
    // Official Blue Tick SVG
    const blueTickHtml = res.blue_tick === 'true' ? `<svg class="blue-tick" viewBox="0 0 24 24" fill="#1d9bf0"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.827 2.76 2.034 3.427-.087.353-.133.718-.133 1.09 0 2.21 1.71 3.998 3.918 3.998.51 0 .998-.106 1.446-.297C9.37 22.42 10.603 23.25 12 23.25c1.397 0 2.63-.83 3.125-2.103.448.19.936.297 1.446.297 2.21 0 3.918-1.79 3.918-4 0-.372-.046-.737-.133-1.09 1.207-.667 2.034-1.967 2.034-3.427zm-11.45 6.1l-4.7-4.7 1.4-1.4 3.3 3.3 8.3-8.3 1.4 1.4-9.7 9.7z"></path></svg>` : '';

    // YouTube Video ID Extractor
    let ytHtml = '';
    if (res.yt_link) {
        const ytMatch = res.yt_link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (ytMatch && ytMatch[1]) {
            const videoId = ytMatch[1];
            ytHtml = `
            <div class="yt-container">
                <h4 style="margin-bottom:8px; color:#555;">Favorite Song 🎵</h4>
                <div class="video-wrapper">
                    <iframe src="https://www.youtube.com/embed/${videoId}?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            </div>`;
        }
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>${res.full_name} - Portfolio</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Lato, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f9fa; color: #0f1419; line-height: 1.6; }
            
            /* Premium Header */
            .wiki-header { background: #fff; padding: 12px 20px; border-bottom: 1px solid #ebeef0; display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
            .wiki-header span { font-weight: 700; font-size: 18px; letter-spacing: 1px; color: #333; }
            
            .container { max-width: 900px; margin: 20px auto; background-color: #ffffff; padding: 35px; border-radius: 12px; border: 1px solid #ebeef0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); min-height: 80vh; }
            
            /* Name & Short Bio */
            .profile-header { margin-bottom: 25px; border-bottom: 1px solid #ebeef0; padding-bottom: 15px; }
            h1 { font-weight: 800; font-size: 1.8em; margin: 0; display: flex; align-items: center; gap: 6px; color: #0f1419; }
            .blue-tick { width: 22px; height: 22px; flex-shrink: 0; }
            .short-bio { font-size: 1.05em; color: #536471; margin-top: 8px; font-weight: 400; line-height: 1.5; }
            
            /* Infobox (Side Panel) */
            .infobox { float: right; clear: right; width: 280px; background-color: #f7f9fa; border: 1px solid #ebeef0; border-radius: 12px; margin: 0 0 20px 25px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
            .infobox img { width: 100%; max-width: 180px; height: auto; display: block; margin: 0 auto 15px auto; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.08); object-fit: cover; aspect-ratio: 1/1; }
            .infobox table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
            .infobox th, .infobox td { padding: 8px 5px; border-top: 1px solid #ebeef0; vertical-align: top; }
            .infobox th { text-align: left; color: #536471; font-weight: 600; width: 40%; }
            .infobox td { color: #0f1419; font-weight: 500;}
            
            /* Links */
            a { color: #1d9bf0; text-decoration: none; }
            a:hover { text-decoration: underline; }
            
            /* Main Content */
            .content p { font-size: 1em; margin-bottom: 15px; color: #333; white-space: pre-line; }
            
            /* YouTube Player CSS */
            .yt-container { margin-top: 25px; margin-bottom: 15px; background: #f7f9fa; padding: 15px; border-radius: 12px; border: 1px solid #ebeef0; }
            .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; }
            .video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

            @media (max-width: 768px) {
                .container { margin: 0; border-radius: 0; border: none; padding: 20px; box-shadow: none; }
                .infobox { float: none; width: 100%; margin: 0 0 25px 0; }
            }
        </style>
    </head>
    <body>
        <div class="wiki-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M2 15h10"/><path d="m9 18 3-3-3-3"/></svg>
            <span>PORTFOLIO</span>
        </div>
        <div class="container">
            <div class="profile-header">
                <h1>${res.full_name} ${blueTickHtml}</h1>
                ${shortBio ? `<div class="short-bio">${shortBio}</div>` : ''}
            </div>
            
            <div class="infobox">
                <img src="${profilePic}" alt="${res.full_name}">
                <table>
                    ${res.profession ? `<tr><th>Occupation</th><td>${res.profession}</td></tr>` : ''}
                    ${res.dob ? `<tr><th>Born</th><td>${res.dob}</td></tr>` : ''}
                    ${res.country ? `<tr><th>Country</th><td>${res.country}</td></tr>` : ''}
                    ${res.instagram ? `<tr><th>Instagram</th><td><a href="${res.instagram}" target="_blank">@${res.instagram.split('/').pop() || 'Profile'}</a></td></tr>` : ''}
                    ${res.linkedin ? `<tr><th>LinkedIn</th><td><a href="${res.linkedin}" target="_blank">View Profile</a></td></tr>` : ''}
                </table>
            </div>

            <div class="content">
                <p>${formattedBio}</p>
                ${ytHtml}
            </div>
            
            <div style="clear: both;"></div>
        </div>
    </body>
    </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html" } });
}
