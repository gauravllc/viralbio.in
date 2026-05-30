export async function onRequest(context) {
    const { env, params } = context;
    const username = params.username.toLowerCase();

    const res = await env.DB.prepare("SELECT * FROM biographies WHERE username = ?").bind(username).first();

    if (!res) {
        return new Response(`
            <div style="font-family:sans-serif; text-align:center; padding:50px;">
                <h1>Profile not found.</h1>
                <p>Please check the URL or search again.</p>
            </div>
        `, { status: 404, headers: { "Content-Type": "text/html" } });
    }

    const defaultPic = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
    const profilePic = res.profile_pic_url || defaultPic;
    
    // Bio Text Formatting with fake citations to look authentic (Links removed, changed to span)
    let formattedBio = res.bio_text ? res.bio_text.replace(/\n\n/g, '<sup class="reference"><span style="color:#0645ad; cursor:text;">[1]</span></sup></p><p>') : '';
    formattedBio = formattedBio ? `<p>${formattedBio}<sup class="reference"><span style="color:#0645ad; cursor:text;">[2]</span></sup></p>` : '';
    
    const shortBio = res.short_bio ? res.short_bio : '';
    const birthYear = res.dob ? res.dob.slice(-4) : 'Unknown';
    const currentYear = new Date().getFullYear();
    const age = birthYear !== 'Unknown' && !isNaN(birthYear) ? ` (age ${currentYear - parseInt(birthYear)})` : '';
    const favCity = res.country ? res.country : 'their hometown';
    
    // Subtle Blue Tick (Blends with Wiki Style)
    const blueTickHtml = res.blue_tick === 'true' ? `<span title="Verified Article" style="display:inline-block; vertical-align:middle; margin-left:5px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="#3b5998"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.827 2.76 2.034 3.427-.087.353-.133.718-.133 1.09 0 2.21 1.71 3.998 3.918 3.998.51 0 .998-.106 1.446-.297C9.37 22.42 10.603 23.25 12 23.25c1.397 0 2.63-.83 3.125-2.103.448.19.936.297 1.446.297 2.21 0 3.918-1.79 3.918-4 0-.372-.046-.737-.133-1.09 1.207-.667 2.034-1.967 2.034-3.427zm-11.45 6.1l-4.7-4.7 1.4-1.4 3.3 3.3 8.3-8.3 1.4 1.4-9.7 9.7z"></path></svg></span>` : '';

    // YouTube Video with Animated "Play Song" Button
    let ytHtml = '';
    if (res.yt_link) {
        const ytMatch = res.yt_link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (ytMatch && ytMatch[1]) {
            ytHtml = `
            <div style="margin: 25px 0; text-align: center; background: #f8f9fa; padding: 20px; border: 1px solid #a2a9b1; border-radius: 8px;">
                <div class="pulse-btn">🎵 Play Favorite Song</div>
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 8px; border: 1px solid #c8ccd1;">
                    <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
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
        <title>${res.full_name} - Archive</title>
        <style>
            /* CORE STYLES - Unchanged Theme */
            body { font-family: sans-serif; margin: 0; padding: 0; background-color: #f6f6f6; color: #202122; font-size: 0.875em; line-height: 1.6; }
            a { text-decoration: none; color: #0645ad; background: none; }
            a:hover { text-decoration: underline; }
            .fake-link { color: #0645ad; cursor: text; }
            
            /* LAYOUT - Adjusted for No Sidebar on Desktop */
            #content { margin: 2em auto; max-width: 960px; padding: 2em 2.5em; background-color: #ffffff; border: 1px solid #a7d7f9; min-height: 80vh; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            
            /* TYPOGRAPHY & CONTENT */
            h1#firstHeading { font-family: 'Linux Libertine', 'Georgia', 'Times', serif; font-weight: normal; margin: 0 0 0.25em 0; padding-bottom: 0.25em; border-bottom: 1px solid #a2a9b1; font-size: 2.4em; line-height: 1.2; display: flex; align-items: center; }
            h2 { font-family: 'Linux Libertine', 'Georgia', 'Times', serif; font-weight: normal; border-bottom: 1px solid #a2a9b1; padding-bottom: 0.2em; margin-top: 1.5em; font-size: 1.6em; }
            #siteSub { font-size: 0.85em; color: #54595d; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 1.5em; text-transform: uppercase; }
            p { margin: 0.4em 0 0.7em 0; font-size: 1.05em; color: #202122; }
            .reference { font-size: 80%; line-height: 1; vertical-align: super; }
            
            /* INFOBOX */
            .infobox { border: 1px solid #a2a9b1; border-spacing: 3px; background-color: #f8f9fa; color: #202122; margin: 0.5em 0 1em 1em; padding: 0.2em; float: right; clear: right; width: 22em; font-size: 90%; }
            .infobox th.infobox-above { background-color: #b0c4de; text-align: center; font-size: 1.25em; font-weight: bold; padding: 5px; }
            .infobox-image img { width: 100%; height: auto; max-width: 300px; display: block; margin: 0 auto; }
            .infobox th { text-align: left; vertical-align: top; width: 35%; padding: 4px; }
            .infobox td { vertical-align: top; padding: 4px; }
            
            /* TOC */
            .toc { background-color: #f8f9fa; border: 1px solid #a2a9b1; padding: 15px 20px; display: inline-block; margin: 1.5em 0; font-size: 95%; min-width: 300px; }
            .toc h2 { margin: 0 0 10px 0; font-size: 1.1em; border: none; padding: 0; }
            .toc ul { list-style: none; padding-left: 0; margin: 0; }
            .toc li { margin-bottom: 6px; }
            .toc .tocnumber { color: #202122; padding-right: 5px; font-weight: bold; }
            .toc .toctext { color: #0645ad; }
            
            /* QUOTE TABLE */
            .cquote { margin: 25px auto; border-collapse: collapse; background: transparent; width: 95%; max-width: 700px; }
            
            /* CATEGORIES FOOTER */
            .catlinks { border: 1px solid #a2a9b1; background-color: #f8f9fa; padding: 8px; margin-top: 2em; clear: both; font-size: 95%; }
            .catlinks ul { display: inline; list-style: none; padding: 0; margin: 0; }
            .catlinks li { display: inline-block; border-left: 1px solid #a2a9b1; margin-left: 0.3em; padding-left: 0.3em; color: #0645ad; }
            .catlinks li:first-child { border-left: none; margin-left: 0; padding-left: 0; }
            
            /* ANIMATED PLAY BUTTON */
            .pulse-btn { display: inline-block; background: #cc0000; color: #fff; padding: 10px 24px; border-radius: 50px; font-weight: bold; font-size: 15px; animation: pulse-animation 1.5s infinite; margin-bottom: 15px; box-shadow: 0 0 0 0 rgba(204, 0, 0, 0.7); border: 1px solid #990000; }
            @keyframes pulse-animation {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(204, 0, 0, 0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(204, 0, 0, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(204, 0, 0, 0); }
            }

            /* MOBILE SPECIFIC - Retained Exact Theme */
            @media (max-width: 800px) {
                #content { margin: 0; padding: 15px; border: none; box-shadow: none; min-height: 100vh; }
                .infobox { float: none; width: 100%; margin: 0 0 1.5em 0; }
            }
        </style>
    </head>
    <body>
        <div id="content">
            <h1 id="firstHeading">${res.full_name} ${blueTickHtml}</h1>
            <div id="siteSub">Verified Public Figure Archive &bull; Global Digital Encyclopedia</div>
            
            <div id="bodyContent">
                <table class="infobox vcard">
                    <tbody>
                        <tr><th colspan="2" class="infobox-above">${res.full_name}</th></tr>
                        <tr><td colspan="2" class="infobox-image"><img src="${profilePic}" alt="${res.full_name}"></td></tr>
                        ${res.dob ? `<tr><th scope="row">Born</th><td>${res.dob}${age}</td></tr>` : ''}
                        ${res.country ? `<tr><th scope="row">Location</th><td>${res.country}</td></tr>` : ''}
                        ${res.profession ? `<tr><th scope="row">Occupation</th><td>${res.profession}</td></tr>` : ''}
                        ${res.instagram ? `<tr><th scope="row">Instagram</th><td><a href="${res.instagram}" target="_blank">View Profile</a></td></tr>` : ''}
                        ${res.linkedin ? `<tr><th scope="row">LinkedIn</th><td><a href="${res.linkedin}" target="_blank">View Profile</a></td></tr>` : ''}
                    </tbody>
                </table>
                
                <p><b>${res.full_name}</b> is a highly regarded Indian ${res.profession ? res.profession.toLowerCase() : 'professional'} based in ${favCity}. ${shortBio} Over the years, they have built a reputation characterized by a meticulous approach to work, an evolving personal brand, and a deep understanding of modern industry dynamics.</p>
                
                <div class="toc">
                    <h2>Contents</h2>
                    <ul>
                        <li><span class="tocnumber">1</span> <span class="toctext">Early life and career</span></li>
                        <li><span class="tocnumber">2</span> <span class="toctext">Strategic vision and leadership</span></li>
                        <li><span class="tocnumber">3</span> <span class="toctext">Adaptability and innovation</span></li>
                        <li><span class="tocnumber">4</span> <span class="toctext">Personal interests and background</span></li>
                        <li><span class="tocnumber">5</span> <span class="toctext">Public image and influence</span></li>
                        <li><span class="tocnumber">6</span> <span class="toctext">Mentorship and community impact</span></li>
                        <li><span class="tocnumber">7</span> <span class="toctext">Career milestones</span></li>
                        <li><span class="tocnumber">8</span> <span class="toctext">Legacy and recognition</span></li>
                        ${ytHtml ? `<li><span class="tocnumber">9</span> <span class="toctext">Media</span></li>` : ''}
                    </ul>
                </div>

                <h2><span class="mw-headline">Early life and career</span></h2>
                ${formattedBio}
                
                <h2><span class="mw-headline">Strategic vision and leadership</span></h2>
                <p>From the onset of their career, <b>${res.full_name}</b> has demonstrated a unique capacity for strategic planning and execution. Colleagues and industry peers often highlight their ability to foresee market trends and adapt accordingly. This proactive mindset has not only safeguarded their professional ventures during turbulent economic times but has also consistently positioned them ahead of the curve.<sup class="reference"><span class="fake-link">[3]</span></sup></p>
                <p>Their leadership style is often described as collaborative yet decisive. By fostering environments that encourage open communication, they have successfully led numerous initiatives that required cross-functional teamwork and high-level problem-solving.</p>

                <h2><span class="mw-headline">Adaptability and innovation</span></h2>
                <p>In an era defined by rapid technological advancements, staying relevant requires a commitment to continuous learning. <b>${res.full_name}</b> has been a vocal advocate for embracing new digital tools and methodologies. Whether it involves adopting cutting-edge software, understanding shifting consumer behaviors, or restructuring operational workflows, their approach is deeply rooted in innovation.<sup class="reference"><span class="fake-link">[4]</span></sup></p>
                <p>This adaptability extends beyond just technical skills; it reflects a broader philosophical openness to change, making them a versatile asset in any professional setting.</p>

                <h2><span class="mw-headline">Personal interests and background</span></h2>
                <p>Beyond their professional endeavors, <b>${res.full_name}</b> maintains a rich tapestry of personal interests that inform their worldview. They draw significant creative and personal inspiration from their favorite city, <b>${favCity}</b>, often citing the location's vibrant culture and history as a grounding force in their busy life.<sup class="reference"><span class="fake-link">[5]</span></sup></p>
                <p>Music also plays a central role in their daily routine, providing both motivation and a means of relaxation. Their eclectic taste in media reflects a personality that values both profound artistic expression and modern entertainment.</p>

                <h2><span class="mw-headline">Public image and influence</span></h2>
                <p>In recent years, <b>${res.full_name}</b> has cultivated a significant presence both professionally and digitally. Their journey reflects a blend of traditional expertise and modern digital adaptability, making them a subject of interest for peers and emerging professionals alike.<sup class="reference"><span class="fake-link">[6]</span></sup></p>
                
                <table class="cquote">
                    <tr>
                        <td style="color: #b2b7f2; font-size: 50px; font-family: 'Times New Roman', serif; font-weight: bold; text-align: left; padding: 10px; vertical-align: top; line-height: 0.5;">“</td>
                        <td style="padding: 15px; font-size: 1.15em; font-style: italic; text-align: center; vertical-align: middle; color: #333;">Success is not just about reaching the top, but about the digital footprint and legacy you leave behind for others to follow.</td>
                        <td style="color: #b2b7f2; font-size: 50px; font-family: 'Times New Roman', serif; font-weight: bold; text-align: right; padding: 10px; vertical-align: bottom; line-height: 0.5;">”</td>
                    </tr>
                    <tr><td colspan="3" style="text-align: right; padding-right: 5%; font-size: 0.9em; font-weight: bold;">— ${res.full_name}</td></tr>
                </table>
                
                <p>Industry observers have frequently noted their ability to connect with audiences and deliver consistent results. As digital platforms become the primary medium for professional networking, their strategic utilization of these tools has further cemented their status as a forward-thinking individual.</p>

                <h2><span class="mw-headline">Mentorship and community impact</span></h2>
                <p>Understanding the value of guidance, <b>${res.full_name}</b> is known to actively share their experiences with newcomers in the industry. They believe in the philosophy of "lifting as you climb," frequently participating in informal mentorship and community discussions.<sup class="reference"><span class="fake-link">[7]</span></sup></p>
                <p>Their insights into career progression, resilience, and personal branding have helped many individuals navigate the early stages of their own careers, amplifying their impact far beyond their immediate professional circle.</p>

                <h2><span class="mw-headline">Career milestones</span></h2>
                <p>The trajectory of <b>${res.full_name}</b>'s career is marked by continuous learning and adaptation. From the early days of their professional journey to their current standing, they have demonstrated a remarkable commitment to excellence.</p>
                
                <table style="width:100%; margin: 1.5em 0; background-color: #f8f9fa; border: 1px solid #a2a9b1; border-collapse: collapse;">
                    <tbody>
                        <tr style="background-color: #eaecf0;"><th style="padding:12px; border: 1px solid #a2a9b1; text-align:left;">Phase</th><th style="padding:12px; border: 1px solid #a2a9b1; text-align:left;">Focus Area</th><th style="padding:12px; border: 1px solid #a2a9b1; text-align:left;">Impact</th></tr>
                        <tr><td style="padding:12px; border: 1px solid #a2a9b1;">Early Foundation</td><td style="padding:12px; border: 1px solid #a2a9b1;">Skill Development & Education</td><td style="padding:12px; border: 1px solid #a2a9b1;">Built a strong core understanding of the industry dynamics and fundamentals.</td></tr>
                        <tr><td style="padding:12px; border: 1px solid #a2a9b1;">Professional Growth</td><td style="padding:12px; border: 1px solid #a2a9b1;">Networking & Execution</td><td style="padding:12px; border: 1px solid #a2a9b1;">Expanded strategic reach and established a highly credible professional reputation.</td></tr>
                        <tr><td style="padding:12px; border: 1px solid #a2a9b1;">Digital Era</td><td style="padding:12px; border: 1px solid #a2a9b1;">Brand Building & Outreach</td><td style="padding:12px; border: 1px solid #a2a9b1;">Achieved notable recognition as a public figure with a verified digital footprint.</td></tr>
                    </tbody>
                </table>

                <h2><span class="mw-headline">Legacy and recognition</span></h2>
                <p>Today, the name <b>${res.full_name}</b> stands as a testament to what can be achieved through dedication, continuous self-improvement, and a clear vision. As they continue to navigate the complexities of their industry, their story serves as an inspiration to many.<sup class="reference"><span class="fake-link">[8]</span></sup></p>
                <p>Whether through direct professional contributions, community engagements, or their expanding digital footprint, they are undoubtedly a prominent figure to watch in the coming years. Their legacy is currently being written, characterized by ambition, resilience, and a forward-looking mindset.</p>

                ${ytHtml ? `<h2><span class="mw-headline">Media</span></h2>${ytHtml}` : ''}
                
                <div style="clear:both;"></div>
                
                <div class="catlinks">
                    <span style="color:#000;">Categories</span>: 
                    <ul>
                        <li><span class="fake-link">Living people</span></li>
                        ${res.country ? `<li><span class="fake-link">People from ${res.country}</span></li>` : ''}
                        ${res.profession ? `<li><span class="fake-link">Indian ${res.profession}s</span></li>` : ''}
                        ${birthYear !== 'Unknown' ? `<li><span class="fake-link">${birthYear} births</span></li>` : ''}
                        <li><span class="fake-link">Public figures</span></li>
                        <li><span class="fake-link">21st-century professionals</span></li>
                    </ul>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html" } });
}
