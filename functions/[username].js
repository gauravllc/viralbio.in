export async function onRequest(context) {
    const { env, params } = context;
    const username = params.username.toLowerCase();

    const res = await env.DB.prepare("SELECT * FROM biographies WHERE username = ?").bind(username).first();

    if (!res) {
        return new Response(`
            <div style="font-family:sans-serif; text-align:center; padding:50px; background:#f4f5f7; height:100vh;">
                <h1>Profile Not Found 💔</h1>
                <p>The requested digital archive does not exist. Please check the URL.</p>
            </div>
        `, { status: 404, headers: { "Content-Type": "text/html" } });
    }

    const defaultPic = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
    const profilePic = res.profile_pic_url || defaultPic;
    
    // Bio Text Formatting (Fake Citations converted to normal text to remove hyperlinks)
    let formattedBio = res.bio_text ? res.bio_text.replace(/\n\n/g, '<sup class="reference">[1]</sup></p><p>') : '';
    formattedBio = formattedBio ? `<p>${formattedBio}<sup class="reference">[2]</sup></p>` : '';
    
    const shortBio = res.short_bio ? res.short_bio : '';
    const birthYear = res.dob ? res.dob.slice(-4) : 'Unknown';
    const currentYear = new Date().getFullYear();
    const age = birthYear !== 'Unknown' && !isNaN(birthYear) ? ` (age ${currentYear - parseInt(birthYear)})` : '';
    
    // Subtle Blue Tick
    const blueTickHtml = res.blue_tick === 'true' ? `<span title="Verified" style="display:inline-block; vertical-align:middle; margin-left:6px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="#1da1f2"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.827 2.76 2.034 3.427-.087.353-.133.718-.133 1.09 0 2.21 1.71 3.998 3.918 3.998.51 0 .998-.106 1.446-.297C9.37 22.42 10.603 23.25 12 23.25c1.397 0 2.63-.83 3.125-2.103.448.19.936.297 1.446.297 2.21 0 3.918-1.79 3.918-4 0-.372-.046-.737-.133-1.09 1.207-.667 2.034-1.967 2.034-3.427zm-11.45 6.1l-4.7-4.7 1.4-1.4 3.3 3.3 8.3-8.3 1.4 1.4-9.7 9.7z"></path></svg></span>` : '';

    // Animated YouTube Video Section
    let ytHtml = '';
    if (res.yt_link) {
        const ytMatch = res.yt_link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (ytMatch && ytMatch[1]) {
            ytHtml = `
            <div class="song-box">
                <div class="music-icon">🎵</div>
                <h3>${res.full_name}'s Favorite Track</h3>
                <p>Music is a profound source of inspiration. Here is the track that resonates the most with their journey.</p>
                <div class="video-wrapper">
                    <iframe src="https://www.youtube.com/embed/${ytMatch[1]}?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            </div>`;
        }
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${res.full_name} - Verified Digital Archive</title>
        <style>
            /* CORE PREMIUM STYLES (No Sidebar, Centered Layout) */
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #eaecf0; color: #202122; font-size: 16px; line-height: 1.7; }
            a { text-decoration: none; color: #0645ad; }
            a:hover { text-decoration: underline; }
            
            /* MAIN CONTAINER */
            #content { max-width: 960px; margin: 40px auto; padding: 40px 50px; background-color: #ffffff; border: 1px solid #a7d7f9; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-radius: 4px; }
            
            /* TYPOGRAPHY */
            h1#firstHeading { font-family: 'Linux Libertine', 'Georgia', 'Times', serif; font-weight: normal; margin: 0 0 5px 0; padding-bottom: 5px; border-bottom: 1px solid #a2a9b1; font-size: 2.5em; line-height: 1.2; display: flex; align-items: center; }
            #siteSub { font-size: 0.9em; color: #54595d; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
            h2 { font-family: 'Linux Libertine', 'Georgia', 'Times', serif; font-weight: normal; font-size: 1.8em; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #a2a9b1; padding-bottom: 0.2em; }
            p { margin: 0.8em 0; font-size: 1.05em; color: #222; text-align: justify; }
            .reference { font-size: 75%; line-height: 1; vertical-align: super; color: #0645ad; font-weight: bold; cursor: default; }
            
            /* INFOBOX */
            .infobox { border: 1px solid #a2a9b1; background-color: #f8f9fa; color: #202122; margin: 0 0 20px 30px; padding: 5px; float: right; clear: right; width: 300px; font-size: 0.9em; box-shadow: 0 2px 5px rgba(0,0,0,0.03); }
            .infobox th.infobox-above { background-color: #b0c4de; text-align: center; font-size: 1.3em; font-weight: bold; padding: 10px; }
            .infobox-image img { width: 100%; height: auto; display: block; margin: 0 auto; object-fit: cover; }
            .infobox table { width: 100%; border-collapse: collapse; }
            .infobox th, .infobox td { vertical-align: top; padding: 8px 6px; border-bottom: 1px solid #eaecf0; }
            .infobox th { text-align: left; width: 35%; color: #54595d; font-weight: 600; }
            
            /* TOC (Table of Contents - No actual links, just span) */
            .toc { background-color: #f8f9fa; border: 1px solid #a2a9b1; padding: 15px 20px; display: inline-block; margin: 1em 0; min-width: 300px; }
            .toc h2 { font-family: sans-serif; margin: 0 0 10px 0; font-size: 1.1em; font-weight: bold; border: none; }
            .toc ul { list-style: none; padding-left: 0; margin: 0; }
            .toc li { margin-bottom: 6px; font-size: 0.95em; color: #0645ad; cursor: default; }
            .toc .tocnumber { color: #202122; padding-right: 8px; font-weight: bold; }
            
            /* QUOTE SECTION */
            .quote-box { background: #fdfdfd; border-left: 4px solid #b0c4de; padding: 20px 30px; margin: 30px 0; font-style: italic; font-size: 1.2em; color: #444; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
            .quote-author { display: block; text-align: right; font-weight: bold; font-style: normal; font-size: 0.85em; margin-top: 10px; color: #777; }

            /* ANIMATED YOUTUBE MUSIC SECTION */
            .song-box { background: linear-gradient(145deg, #f0f4f8, #ffffff); border: 1px solid #d1d5db; padding: 30px; border-radius: 12px; text-align: center; margin: 40px 0; box-shadow: 0 8px 20px rgba(0,0,0,0.04); }
            .music-icon { font-size: 45px; display: inline-block; animation: pulseMusic 1.5s infinite alternate; margin-bottom: 10px; }
            @keyframes pulseMusic { 0% { transform: scale(0.9); opacity: 0.8; } 100% { transform: scale(1.15); opacity: 1; } }
            .song-box h3 { margin: 0 0 10px 0; font-family: sans-serif; color: #111827; font-size: 1.5em; }
            .song-box p { color: #4b5563; margin-bottom: 20px; font-size: 1em; text-align: center; }
            .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            .video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

            /* CATEGORIES FOOTER */
            .catlinks { border: 1px solid #a2a9b1; background-color: #f8f9fa; padding: 10px; margin-top: 40px; clear: both; font-size: 0.9em; }
            .catlinks ul { display: inline; list-style: none; padding: 0; margin: 0; }
            .catlinks li { display: inline-block; border-left: 1px solid #a2a9b1; margin-left: 0.5em; padding-left: 0.5em; color: #0645ad; }
            .catlinks li:first-child { border-left: none; margin-left: 0; padding-left: 0; }
            
            /* MOBILE SPECIFIC */
            @media (max-width: 800px) {
                body { background-color: #ffffff; }
                #content { margin: 0; padding: 20px 15px; border: none; box-shadow: none; border-radius: 0; }
                .infobox { float: none; width: 100%; margin: 0 0 25px 0; box-sizing: border-box; }
                .toc { width: 100%; box-sizing: border-box; }
                h1#firstHeading { font-size: 2em; }
            }
        </style>
    </head>
    <body>
        <div id="content">
            <h1 id="firstHeading">${res.full_name} ${blueTickHtml}</h1>
            <div id="siteSub">Verified Public Figure Archive &bull; Global Digital Encyclopedia</div>
            
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
            
            <p><b>${res.full_name}</b> is an Indian ${res.profession ? res.profession.toLowerCase() : 'professional'} ${res.country ? `from ${res.country}` : ''}. ${shortBio} Known for their meticulous approach to work and an evolving personal brand, they have established themselves as a highly recognizable and influential figure in their respective domain.<sup class="reference">[1]</sup></p>
            
            <p>Throughout their career, ${res.full_name} has consistently demonstrated a unique ability to bridge the gap between complex industry demands and practical, innovative execution. This strategic mindset has not only elevated their personal standing but has also set a benchmark for emerging talents navigating the modern digital landscape.<sup class="reference">[2]</sup></p>
            
            <div class="toc">
                <h2>Contents</h2>
                <ul>
                    <li><span class="tocnumber">1</span> <span class="toctext">Early life and foundational career</span></li>
                    <li><span class="tocnumber">2</span> <span class="toctext">Professional philosophy and work ethic</span></li>
                    <li><span class="tocnumber">3</span> <span class="toctext">Public image and digital influence</span></li>
                    <li><span class="tocnumber">4</span> <span class="toctext">Personal life and interests</span></li>
                    <li><span class="tocnumber">5</span> <span class="toctext">Philanthropy and community engagement</span></li>
                    <li><span class="tocnumber">6</span> <span class="toctext">Future endeavors and legacy</span></li>
                </ul>
            </div>

            <h2>Early life and foundational career</h2>
            ${formattedBio}
            <p>During the formative years of their journey, ${res.full_name} displayed an innate curiosity and a relentless drive for knowledge. They dedicated significant time to mastering the core principles of their field, laying a robust foundation that would eventually support their large-scale professional ambitions. This early phase was characterized by rigorous learning, networking with key industry figures, and a willingness to take calculated risks.<sup class="reference">[3]</sup></p>
            
            <h2>Professional philosophy and work ethic</h2>
            <p>The success of <b>${res.full_name}</b> is frequently attributed to a disciplined and visionary work ethic. They operate on the principle that true growth happens at the intersection of consistency and innovation. Colleagues and industry observers often note their exceptional problem-solving skills and their capacity to remain composed under high-pressure scenarios.</p>
            
            <div class="quote-box">
                "Growth is never by mere chance; it is the result of forces working together with absolute dedication. The digital age belongs to those who adapt without losing their core authenticity."
                <span class="quote-author">— ${res.full_name}</span>
            </div>
            
            <p>By continuously updating their skill set and staying ahead of global trends, ${res.full_name} ensures that their strategies remain relevant and highly effective, creating long-term value for every project they associate with.<sup class="reference">[4]</sup></p>
            
            <h2>Public image and digital influence</h2>
            <p>In recent years, ${res.full_name} has cultivated a significant and highly engaged presence both professionally and digitally. Their journey reflects a seamless blend of traditional expertise and modern digital adaptability. As digital platforms have become the primary medium for global networking, their strategic utilization of these tools has further cemented their status as a forward-thinking and relatable individual.</p>
            <p>They are widely regarded as a thought leader, frequently sharing insights that resonate with a global audience. Their digital footprint is curated with precision, reflecting authenticity, professionalism, and a commitment to adding value to the community.<sup class="reference">[5]</sup></p>
            
            <h2>Personal life and interests</h2>
            <p>While deeply committed to their professional endeavors, <b>${res.full_name}</b> maintains a highly balanced personal life. They are an avid traveler, often exploring vibrant global cities and diverse cultures, which heavily inspires their creative and strategic thinking. Furthermore, they have a profound appreciation for arts and media, utilizing them as a medium to disconnect and recharge.</p>
            
            ${ytHtml}
            
            <h2>Philanthropy and community engagement</h2>
            <p>Beyond their professional milestones, ${res.full_name} is known for a strong sense of social responsibility. They actively support initiatives aimed at empowering the youth, promoting digital literacy, and fostering inclusive growth. By mentoring emerging professionals and participating in community-driven campaigns, they ensure that their success acts as a catalyst for the upliftment of others.<sup class="reference">[6]</sup></p>

            <h2>Future endeavors and legacy</h2>
            <p>Today, the name <b>${res.full_name}</b> stands as a powerful testament to what can be achieved through unwavering dedication and a clear, actionable vision. As they continue to expand their horizons and take on new challenges, their story serves as an ongoing inspiration. Whether through direct professional contributions or their expanding global footprint, they are undoubtedly a prominent figure whose legacy will influence the industry for years to come.<sup class="reference">[7]</sup></p>
            
            <div style="clear:both;"></div>
            
            <div class="catlinks">
                <span style="color:#54595d; font-weight:bold;">Categories:</span> 
                <ul>
                    <li>Living people</li>
                    ${res.country ? `<li>People from ${res.country}</li>` : ''}
                    ${res.profession ? `<li>Indian ${res.profession}s</li>` : ''}
                    <li>21st-century innovators</li>
                    ${birthYear !== 'Unknown' ? `<li>${birthYear} births</li>` : ''}
                </ul>
            </div>
        </div>
    </body>
    </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html" } });
}
