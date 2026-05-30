export async function onRequest(context) {
    const { env, params } = context;
    const username = params.username.toLowerCase();

    const res = await env.DB.prepare("SELECT * FROM biographies WHERE username = ?").bind(username).first();

    if (!res) {
        return new Response(`
            <div style="font-family:sans-serif; text-align:center; padding:50px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/de/Wikipedia_Logo_1.0.png" width="100">
                <h1>Wikipedia does not have an article with this exact name.</h1>
                <p>Please check the URL or search again.</p>
            </div>
        `, { status: 404, headers: { "Content-Type": "text/html" } });
    }

    const defaultPic = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
    const profilePic = res.profile_pic_url || defaultPic;
    
    // Bio Text Formatting with fake citations to look authentic
    let formattedBio = res.bio_text ? res.bio_text.replace(/\n\n/g, '<sup class="reference"><a href="#">[1]</a></sup></p><p>') : '';
    formattedBio = formattedBio ? `<p>${formattedBio}<sup class="reference"><a href="#">[2]</a></sup></p>` : '';
    
    const shortBio = res.short_bio ? res.short_bio : '';
    const birthYear = res.dob ? res.dob.slice(-4) : 'Unknown';
    const currentYear = new Date().getFullYear();
    const age = birthYear !== 'Unknown' && !isNaN(birthYear) ? ` (age ${currentYear - parseInt(birthYear)})` : '';
    
    // Subtle Blue Tick (Blends with Wiki Style)
    const blueTickHtml = res.blue_tick === 'true' ? `<span title="Verified Article" style="display:inline-block; vertical-align:middle; margin-left:5px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="#3b5998"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.827 2.76 2.034 3.427-.087.353-.133.718-.133 1.09 0 2.21 1.71 3.998 3.918 3.998.51 0 .998-.106 1.446-.297C9.37 22.42 10.603 23.25 12 23.25c1.397 0 2.63-.83 3.125-2.103.448.19.936.297 1.446.297 2.21 0 3.918-1.79 3.918-4 0-.372-.046-.737-.133-1.09 1.207-.667 2.034-1.967 2.034-3.427zm-11.45 6.1l-4.7-4.7 1.4-1.4 3.3 3.3 8.3-8.3 1.4 1.4-9.7 9.7z"></path></svg></span>` : '';

    // YouTube Video (Wikimedia Thumb Style)
    let ytHtml = '';
    if (res.yt_link) {
        const ytMatch = res.yt_link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (ytMatch && ytMatch[1]) {
            ytHtml = `
            <div class="thumb tright">
                <div class="thumbinner" style="width:302px;">
                    <iframe width="300" height="169" src="https://www.youtube.com/embed/${ytMatch[1]}?rel=0" frameborder="0" allowfullscreen></iframe>
                    <div class="thumbcaption">
                        <div class="magnify"><a href="#"></a></div>
                        Featured media content relating to ${res.full_name}.
                    </div>
                </div>
            </div>`;
        }
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en" dir="ltr" class="client-nojs">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${res.full_name} - Wikipedia</title>
        <style>
            /* CORE WIKIPEDIA STYLES */
            body { font-family: sans-serif; margin: 0; padding: 0; background-color: #f6f6f6; color: #202122; font-size: 0.875em; line-height: 1.6; }
            a { text-decoration: none; color: #0645ad; background: none; }
            a:hover { text-decoration: underline; }
            
            /* LAYOUT */
            #mw-page-base { height: 5em; background-color: #f6f6f6; background-image: linear-gradient(to bottom, #ffffff 50%, #f6f6f6 100%); }
            #content { margin-left: 11em; padding: 1.25em 1.5em 1.5em 1.5em; background-color: #ffffff; border: 1px solid #a7d7f9; border-right-width: 0; margin-top: -3em; min-height: 80vh; }
            
            /* HEADER & TABS */
            #mw-head { position: absolute; top: 0; right: 0; width: 100%; pointer-events: none; }
            #p-personal, #p-search { float: right; pointer-events: auto; }
            #p-personal ul { list-style: none; margin: 0.5em 1em; padding: 0; display: flex; gap: 15px; font-size: 0.75em; }
            .mw-portlet-tabs { float: left; margin-left: 11em; pointer-events: auto; }
            .mw-portlet-tabs ul { list-style: none; margin: 0; padding: 0; display: flex; }
            .mw-portlet-tabs li { margin: 0; padding: 0; display: inline-block; background-image: linear-gradient(to top, #ffffff 5%, #f6f6f6 95%); border: 1px solid #a7d7f9; border-bottom: none; margin-right: 0.3em; border-top-left-radius: 4px; border-top-right-radius: 4px; }
            .mw-portlet-tabs li.selected { background: #ffffff; }
            .mw-portlet-tabs li a { display: block; padding: 1.2em 1em 0.2em; font-size: 0.8em; color: #0645ad; }
            .mw-portlet-tabs li.selected a { color: #202122; font-weight: bold; text-decoration: none; }
            
            /* SIDEBAR */
            #mw-panel { position: absolute; top: 0; width: 10em; left: 0; font-size: 0.75em; padding-top: 1em; }
            .mw-wiki-logo { display: block; width: 10em; height: 10em; background-image: url('https://upload.wikimedia.org/wikipedia/commons/d/de/Wikipedia_Logo_1.0.png'); background-size: 80%; background-position: center center; background-repeat: no-repeat; text-align: center; }
            .mw-wiki-logo-text { font-family: "Linux Libertine", "Georgia", "Times", serif; font-size: 1.5em; color: #000; margin-top: 5.5em; display: block; letter-spacing: 1px;}
            .portal { margin: 1em 0.5em 1em 1em; }
            .portal h3 { font-size: 0.8em; color: #54595d; font-weight: normal; margin: 0 0 0.5em 0; border-bottom: 1px solid #c8ccd1; padding-bottom: 3px; }
            .portal ul { list-style: none; margin: 0; padding: 0; }
            .portal ul li { margin-bottom: 0.25em; line-height: 1.125; }
            
            /* TYPOGRAPHY & CONTENT */
            h1#firstHeading { font-family: 'Linux Libertine', 'Georgia', 'Times', serif; font-weight: normal; margin: 0 0 0.25em 0; padding-bottom: 0.25em; border-bottom: 1px solid #a2a9b1; font-size: 2.2em; line-height: 1.2; display: flex; align-items: center; }
            #siteSub { font-size: 0.85em; color: #54595d; margin-bottom: 1.5em; }
            p { margin: 0.4em 0 0.5em 0; font-size: 1.05em; color: #202122; }
            .reference { font-size: 80%; line-height: 1; vertical-align: super; }
            
            /* INFOBOX */
            .infobox { border: 1px solid #a2a9b1; border-spacing: 3px; background-color: #f8f9fa; color: #202122; margin: 0.5em 0 1em 1em; padding: 0.2em; float: right; clear: right; width: 22em; font-size: 90%; }
            .infobox th.infobox-above { background-color: #b0c4de; text-align: center; font-size: 1.25em; font-weight: bold; padding: 5px; }
            .infobox-image img { width: 100%; height: auto; max-width: 300px; display: block; margin: 0 auto; }
            .infobox th { text-align: left; vertical-align: top; width: 35%; padding: 4px; }
            .infobox td { vertical-align: top; padding: 4px; }
            
            /* TOC & MEDIA */
            .toc { background-color: #f8f9fa; border: 1px solid #a2a9b1; padding: 10px 15px; display: inline-block; margin: 1em 0; font-size: 95%; }
            .toc h2 { margin: 0 0 5px 0; font-size: 1em; border: none; }
            .toc ul { list-style: none; padding-left: 0; margin: 0; }
            .toc li { margin-bottom: 3px; }
            .toc .tocnumber { color: #202122; padding-right: 5px; }
            
            .thumb { margin-bottom: .5em; width: auto; background-color: transparent; border-color: white; }
            .tright { float: right; clear: right; margin: .5em 0 1.3em 1.4em; }
            .thumbinner { border: 1px solid #c8ccd1; padding: 3px; background-color: #f8f9fa; font-size: 94%; text-align: center; overflow: hidden; }
            .thumbcaption { border: none; line-height: 1.4; padding: 3px; font-size: 94%; text-align: left; }
            
            /* CATEGORIES FOOTER */
            .catlinks { border: 1px solid #a2a9b1; background-color: #f8f9fa; padding: 5px; margin-top: 1em; clear: both; font-size: 90%; }
            .catlinks ul { display: inline; list-style: none; padding: 0; margin: 0; }
            .catlinks li { display: inline-block; border-left: 1px solid #a2a9b1; margin-left: 0.25em; padding-left: 0.25em; }
            .catlinks li:first-child { border-left: none; margin-left: 0; padding-left: 0; }
            
            /* MOBILE SPECIFIC */
            @media (max-width: 800px) {
                #mw-panel, .mw-portlet-tabs, #mw-page-base, #p-personal { display: none; }
                #content { margin-left: 0; margin-top: 0; padding: 1em; border: none; }
                .infobox { float: none; width: 100%; margin: 0 0 1em 0; }
                .tright { float: none; margin: 1em auto; }
            }
        </style>
    </head>
    <body>
        <div id="mw-page-base"></div>
        <div id="mw-head-base"></div>
        
        <div id="mw-head">
            <div id="p-personal">
                <ul>
                    <li><a href="#">Not logged in</a></li>
                    <li><a href="#">Talk</a></li>
                    <li><a href="#">Contributions</a></li>
                    <li><a href="#">Create account</a></li>
                    <li><a href="#">Log in</a></li>
                </ul>
            </div>
            <div class="mw-portlet-tabs">
                <ul>
                    <li class="selected"><a href="#">Article</a></li>
                    <li><a href="#">Talk</a></li>
                </ul>
            </div>
            <div class="mw-portlet-tabs" style="float:right; margin-left:0; margin-right:1em;">
                <ul>
                    <li class="selected"><a href="#">Read</a></li>
                    <li><a href="#">Edit</a></li>
                    <li><a href="#">View history</a></li>
                </ul>
            </div>
        </div>
        
        <div id="mw-panel">
            <div class="mw-wiki-logo">
                <span class="mw-wiki-logo-text">WIKIPEDIA<br><span style="font-size:0.5em; font-family:sans-serif; letter-spacing:0;">The Free Encyclopedia</span></span>
            </div>
            <div class="portal">
                <ul>
                    <li><a href="#">Main page</a></li>
                    <li><a href="#">Contents</a></li>
                    <li><a href="#">Current events</a></li>
                    <li><a href="#">Random article</a></li>
                    <li><a href="#">About Wikipedia</a></li>
                    <li><a href="#">Contact us</a></li>
                    <li><a href="#">Donate</a></li>
                </ul>
            </div>
            <div class="portal">
                <h3>Tools</h3>
                <ul>
                    <li><a href="#">What links here</a></li>
                    <li><a href="#">Related changes</a></li>
                    <li><a href="#">Special pages</a></li>
                    <li><a href="#">Permanent link</a></li>
                    <li><a href="#">Page information</a></li>
                </ul>
            </div>
        </div>

        <div id="content">
            <h1 id="firstHeading">${res.full_name} ${blueTickHtml}</h1>
            <div id="siteSub">From Wikipedia, the free encyclopedia</div>
            
            <div id="bodyContent">
                <table class="infobox vcard">
                    <tbody>
                        <tr><th colspan="2" class="infobox-above">${res.full_name}</th></tr>
                        <tr><td colspan="2" class="infobox-image"><img src="${profilePic}" alt="${res.full_name}"></td></tr>
                        ${res.dob ? `<tr><th scope="row">Born</th><td>${res.dob}${age}</td></tr>` : ''}
                        ${res.country ? `<tr><th scope="row">Nationality</th><td>${res.country}</td></tr>` : ''}
                        ${res.profession ? `<tr><th scope="row">Occupation</th><td>${res.profession}</td></tr>` : ''}
                        ${res.instagram ? `<tr><th scope="row">Instagram</th><td><a href="${res.instagram}" target="_blank">@${res.instagram.split('/').pop() || 'Profile'}</a></td></tr>` : ''}
                        ${res.linkedin ? `<tr><th scope="row">LinkedIn</th><td><a href="${res.linkedin}" target="_blank">View Profile</a></td></tr>` : ''}
                    </tbody>
                </table>
                
                <p><b>${res.full_name}</b> is an Indian ${res.profession ? res.profession.toLowerCase() : 'professional'} ${res.country ? `from ${res.country}` : ''}. ${shortBio}</p>
                
                <div class="toc">
                    <h2>Contents</h2>
                    <ul>
                        <li><a href="#"><span class="tocnumber">1</span> <span class="toctext">Early life and career</span></a></li>
                        <li><a href="#"><span class="tocnumber">2</span> <span class="toctext">Public image</span></a></li>
                        <li><a href="#"><span class="tocnumber">3</span> <span class="toctext">Media</span></a></li>
                        <li><a href="#"><span class="tocnumber">4</span> <span class="toctext">References</span></a></li>
                    </ul>
                </div>

                <h2><span class="mw-headline">Early life and career</span></h2>
                ${formattedBio}
                
                ${ytHtml ? `<h2><span class="mw-headline">Media</span></h2>${ytHtml}` : ''}
                
                <div style="clear:both;"></div>
                
                <div class="catlinks">
                    <a href="#">Categories</a>: 
                    <ul>
                        <li><a href="#">Living people</a></li>
                        ${res.country ? `<li><a href="#">People from ${res.country}</a></li>` : ''}
                        ${res.profession ? `<li><a href="#">Indian ${res.profession}s</a></li>` : ''}
                        ${birthYear !== 'Unknown' ? `<li><a href="#">${birthYear} births</a></li>` : ''}
                    </ul>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html" } });
}
