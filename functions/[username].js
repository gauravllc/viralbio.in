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

    // YouTube Audio Player with Visualizer
    let ytHtml = '';
    if (res.yt_link) {
        const ytMatch = res.yt_link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (ytMatch && ytMatch[1]) {
            const videoId = ytMatch[1];
            ytHtml = `
            <div style="margin: 25px 0; background: #f8f9fa; padding: 20px; border: 1px solid #a2a9b1; border-radius: 8px; display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:20px;">
                <button id="play-yt-btn" class="pulse-btn">🎵 Play Favorite Song</button>
                <div id="visualizer" class="visualizer" style="display:none;">
                    <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
                </div>
                <div style="position:absolute; width:1px; height:1px; overflow:hidden; left:-9999px;">
                    <div id="yt-player"></div>
                </div>
            </div>
            
            <script src="https://www.youtube.com/iframe_api"></script>
            <script>
                var player;
                function onYouTubeIframeAPIReady() {
                    player = new YT.Player('yt-player', {
                        height: '1', width: '1', videoId: '${videoId}',
                        playerVars: { 'autoplay': 0, 'controls': 0, 'playsinline': 1 },
                        events: { 'onStateChange': onPlayerStateChange }
                    });
                }
                function onPlayerStateChange(event) {
                    var btn = document.getElementById('play-yt-btn');
                    var vis = document.getElementById('visualizer');
                    if(event.data == YT.PlayerState.PLAYING) {
                        vis.style.display = 'flex';
                        btn.innerText = '⏸ Pause Song';
                        btn.style.background = '#333';
                        btn.style.boxShadow = 'none';
                        btn.style.animation = 'none';
                    } else {
                        vis.style.display = 'none';
                        btn.innerText = '🎵 Play Favorite Song';
                        btn.style.background = '#cc0000';
                        btn.style.animation = 'pulse-animation 1.5s infinite';
                    }
                }
                document.getElementById('play-yt-btn').addEventListener('click', function() {
                    if (player && typeof player.getPlayerState === 'function') {
                        if (player.getPlayerState() == YT.PlayerState.PLAYING) {
                            player.pauseVideo();
                        } else {
                            player.playVideo();
                        }
                    }
                });
            </script>`;
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
            
            /* AUDIO VISUALIZER & BUTTON */
            .pulse-btn { border:none; display: inline-block; background: #cc0000; color: #fff; padding: 12px 28px; border-radius: 50px; font-weight: bold; font-size: 15px; animation: pulse-animation 1.5s infinite; cursor: pointer; font-family: inherit; transition: 0.3s; }
            .visualizer { display: flex; align-items: flex-end; gap: 4px; height: 35px; }
            .bar { width: 6px; background: #3b5998; animation: bounce 0.5s infinite alternate; border-radius: 4px; }
            .bar:nth-child(2) { animation-delay: 0.1s; }
            .bar:nth-child(3) { animation-delay: 0.2s; }
            .bar:nth-child(4) { animation-delay: 0.3s; }
            .bar:nth-child(5) { animation-delay: 0.4s; }
            @keyframes bounce { from { height: 8px; } to { height: 35px; } }
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
                        
                        ${res.instagram ? `<tr><th scope="row">Instagram</th><td><a href="${res.instagram}" target="_blank" style="color:#0645ad; font-weight:bold;">@${res.instagram.split('/').filter(Boolean).pop()}</a></td></tr>` : ''}
                        ${res.linkedin ? `<tr><th scope="row">LinkedIn</th><td><a href="${res.linkedin}" target="_blank" style="color:#0645ad; font-weight:bold;">@${res.linkedin.split('/').filter(Boolean).pop()}</a></td></tr>` : ''}
                        ${res.youtube ? `<tr><th scope="row">YouTube</th><td><a href="${res.youtube}" target="_blank" style="color:#0645ad; font-weight:bold;">@${res.youtube.split('/').filter(Boolean).pop()}</a></td></tr>` : ''}
                    </tbody>
                </table>
                
                <p><b>${res.full_name}</b> is a highly regarded Indian ${res.profession ? res.profession.toLowerCase() : 'professional'} based in ${favCity}. ${shortBio} Over the years, they have built a reputation characterized by a meticulous approach to work, an evolving personal brand, and a deep understanding of modern industry dynamics.</p>
                <p>Recognized for pushing boundaries and fostering a culture of excellence, they stand as a prominent figure among contemporary peers. Their work seamlessly blends traditional values with forward-thinking digital strategies.</p>
                
                <div class="toc">
                    <h2>Contents</h2>
                    <ul>
                        <li><span class="tocnumber">1</span> <span class="toctext">Early life and educational background</span></li>
                        <li><span class="tocnumber">2</span> <span class="toctext">Career beginnings</span></li>
                        <li><span class="tocnumber">3</span> <span class="toctext">Strategic vision and leadership</span></li>
                        <li><span class="tocnumber">4</span> <span class="toctext">Business ventures and investments</span></li>
                        <li><span class="tocnumber">5</span> <span class="toctext">Adaptability and innovation</span></li>
                        <li><span class="tocnumber">6</span> <span class="toctext">Personal philosophy and work ethic</span></li>
                        <li><span class="tocnumber">7</span> <span class="toctext">Philanthropy and social impact</span></li>
                        <li><span class="tocnumber">8</span> <span class="toctext">Public image and influence</span></li>
                        <li><span class="tocnumber">9</span> <span class="toctext">Awards and recognition</span></li>
                        <li><span class="tocnumber">10</span> <span class="toctext">Global perspective and future projects</span></li>
                        ${ytHtml ? `<li><span class="tocnumber">11</span> <span class="toctext">Favorite Media</span></li>` : ''}
                    </ul>
                </div>

                <h2><span class="mw-headline">Early life and educational background</span></h2>
                ${formattedBio}
                <p>During their formative years, <b>${res.full_name}</b> displayed an exceptional aptitude for problem-solving and critical thinking. They spent significant time observing industry patterns, which later served as the foundation for their professional endeavors. Their academic journey was marked by a deep curiosity, driving them to participate in numerous extracurricular activities that sharpened their leadership abilities.</p>
                <p>Educators and mentors noted their relentless drive to succeed. The exposure to diverse cultures and diverse educational systems instilled in them a unique worldview, one that appreciates nuance while striving for absolute perfection in execution.<sup class="reference"><span class="fake-link">[3]</span></sup></p>

                <h2><span class="mw-headline">Career beginnings</span></h2>
                <p>The initial phase of their career was defined by rapid learning and adaptation. Stepping into a highly competitive environment, they were tasked with roles that demanded long hours and high-pressure decision making. Instead of buckling under the pressure, they utilized this period to build a robust professional network and learn the grassroots operations of their industry.</p>
                <p>It was during this time that they formulated the core methodologies that would later become their signature style. By prioritizing long-term value over short-term gains, they quickly distinguished themselves from their contemporaries.<sup class="reference"><span class="fake-link">[4]</span></sup></p>

                <h2><span class="mw-headline">Strategic vision and leadership</span></h2>
                <p>From the onset of their career, <b>${res.full_name}</b> has demonstrated a unique capacity for strategic planning and execution. Colleagues and industry peers often highlight their ability to foresee market trends and adapt accordingly. This proactive mindset has not only safeguarded their professional ventures during turbulent economic times but has also consistently positioned them ahead of the curve.<sup class="reference"><span class="fake-link">[5]</span></sup></p>
                <p>Their leadership style is often described as collaborative yet decisive. By fostering environments that encourage open communication, they have successfully led numerous initiatives that required cross-functional teamwork and high-level problem-solving. Subordinates often cite their empathetic approach as a key factor in boosting team morale and productivity.</p>

                <h2><span class="mw-headline">Business ventures and investments</span></h2>
                <p>Recognizing the importance of diversification, they have strategically aligned themselves with several forward-thinking ventures. Their investment portfolio reflects a keen interest in sustainable growth, technological advancement, and community-driven projects. By backing initiatives that aim to solve real-world problems, they have proven that profitability and ethical business practices can coexist harmoniously.<sup class="reference"><span class="fake-link">[6]</span></sup></p>

                <h2><span class="mw-headline">Adaptability and innovation</span></h2>
                <p>In an era defined by rapid technological advancements, staying relevant requires a commitment to continuous learning. <b>${res.full_name}</b> has been a vocal advocate for embracing new digital tools and methodologies. Whether it involves adopting cutting-edge software, understanding shifting consumer behaviors, or restructuring operational workflows, their approach is deeply rooted in innovation.<sup class="reference"><span class="fake-link">[7]</span></sup></p>
                <p>This adaptability extends beyond just technical skills; it reflects a broader philosophical openness to change, making them a versatile asset in any professional setting. They often speak at industry panels emphasizing the need for 'disruptive thinking' in traditional sectors.</p>

                <h2><span class="mw-headline">Personal philosophy and work ethic</span></h2>
                <p>The driving force behind their success is a rigorously maintained personal philosophy centered around discipline, integrity, and relentless pursuit of excellence. They maintain that true professional fulfillment comes not just from monetary success, but from the positive impact one leaves on their ecosystem.<sup class="reference"><span class="fake-link">[8]</span></sup></p>
                <p>Maintaining a delicate balance between their professional commitments and personal growth, they draw significant creative and personal inspiration from their favorite city, <b>${favCity}</b>, often citing the location's vibrant culture as a grounding force in their busy life.</p>

                <h2><span class="mw-headline">Philanthropy and social impact</span></h2>
                <p>Understanding the value of giving back, <b>${res.full_name}</b> is known to actively support various social causes. They believe in the philosophy of "lifting as you climb," frequently participating in informal mentorship programs, community discussions, and supporting educational initiatives for underprivileged youth. Their philanthropic efforts, though often kept private, have made a tangible difference in multiple communities.<sup class="reference"><span class="fake-link">[9]</span></sup></p>

                <h2><span class="mw-headline">Public image and influence</span></h2>
                <p>In recent years, they have cultivated a significant presence both professionally and digitally. Their journey reflects a blend of traditional expertise and modern digital adaptability, making them a subject of interest for peers and emerging professionals alike.<sup class="reference"><span class="fake-link">[10]</span></sup></p>
                
                <table class="cquote">
                    <tr>
                        <td style="color: #b2b7f2; font-size: 50px; font-family: 'Times New Roman', serif; font-weight: bold; text-align: left; padding: 10px; vertical-align: top; line-height: 0.5;">“</td>
                        <td style="padding: 15px; font-size: 1.15em; font-style: italic; text-align: center; vertical-align: middle; color: #333;">True success is measured not by the milestones you reach, but by the digital footprint and lasting legacy you leave behind for others to build upon.</td>
                        <td style="color: #b2b7f2; font-size: 50px; font-family: 'Times New Roman', serif; font-weight: bold; text-align: right; padding: 10px; vertical-align: bottom; line-height: 0.5;">”</td>
                    </tr>
                    <tr><td colspan="3" style="text-align: right; padding-right: 5%; font-size: 0.9em; font-weight: bold;">— ${res.full_name}</td></tr>
                </table>
                
                <p>Industry observers have frequently noted their ability to connect with audiences and deliver consistent results. As digital platforms become the primary medium for professional networking, their strategic utilization of these tools has further cemented their status as a forward-thinking individual.</p>

                <h2><span class="mw-headline">Awards and recognition</span></h2>
                <p>The dedication to their craft has not gone unnoticed. Throughout their career, they have been the recipient of numerous internal and external commendations. Peers frequently cite their work as the benchmark for quality and reliability. While they remain humble about these accolades, the continuous stream of recognition highlights their sustained excellence over the years.<sup class="reference"><span class="fake-link">[11]</span></sup></p>

                <h2><span class="mw-headline">Global perspective and future projects</span></h2>
                <p>Looking ahead, the trajectory remains aggressively upward. With an expanding network that spans across borders, their future projects aim to integrate global best practices into local markets. By fostering cross-cultural business relationships, they are setting the stage for international collaborations that promise to redefine standard operating procedures in their field.<sup class="reference"><span class="fake-link">[12]</span></sup></p>
                <p>Their legacy is currently being written, characterized by ambition, resilience, and a forward-looking mindset that ensures they will remain a relevant and powerful voice for decades to come.</p>

                ${ytHtml ? `<h2><span class="mw-headline">Favorite Media</span></h2>${ytHtml}` : ''}
                
                <div style="clear:both; margin-bottom: 40px;"></div>
                
            </div>
        </div>
    </body>
    </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html" } });
}
