const APM_LOGO_DATA_URI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoKCgoKCgsMDAsPEA4QDxYUExMUFiIYGhgaGCIzICUgICUgMy03LCksNy1RQDg4QFFeT0pPXnFlZXGPiI+7u/sBCgoKCgoKCwwMCw8QDhAPFhQTExQWIhgaGBoYIjMgJSAgJSAzLTcsKSw3LVFAODhAUV5PSk9ecWVlcY+Ij7u7+//CABEIAJgClwMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAwQFAgEGAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAALZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOY6UpZqwNZOfY9FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPIKeOlmrLbzupd8qXNyrWlm49GOfXP0b5gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEdPOrVPq3npUty1rnurxZzupPc61mOQ1yCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDHdTyxnrWtwTE3MeDvl9GytY5ZUBue5FY+g8q4x9K5gJ+vmPpj3z2oWWNUPpPcXQLLAnNj3Htl3zJiNv3HhN/nn5w+nQ9nvvzW8TdYWwd+4XZt89fPn0CPoe/PSG957TLfuRrgzi+wZzY9+f+gAAAAAAAAAAABFEsdXrO/OLkiwTe8axl2cue5h3sO8Q89dLJna/ZHj7FQmrRSJW+jwN9fQPmfpvmT6YHz1mtqJV1K1hczjuc4p2vUv4G/kLLJW5SHczdJcrXyNcx5odlKNKaofQ1LWKtuv7ymrHTuLV1sTRLWdZ4MuaxKlPY+b+kUAAAAAAAAAADmCyl89ECkMwqWw4p3xUlmAEMVsVe5xQvegBm6QAz+NMZlm0Kc8o5oaI4qXhBxaFKzIKNvsUbnQ4z9MQ17weejOtzDMaYzrU4zGmM3SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/xAAC/9oADAMBAAIAAwAAACHzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzwI/ArzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzgbMdoXzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzgVgY5gPzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzgfigACwDzwjghygQARTDyDLRSjxSwhTzzzzzzzzzzwMtpD9O6KrsrxbzvhAXxMpRv8i9AxRvDzzzzzzzzzzxAbyzxwzzxxzyzyACzzwywwyyzxwywyzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz/xAAC/9oADAMBAAIAAwAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD9AzMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARym7Q8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQOeRv0wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAThQDIQLIYDYQo4LZrYYxpoxYR4CgA6IAAAAAAAAAADgOVoVVRgDXwDwBFKoMIEC6HEam7aYE4AAAAAAAAAAC5sACDCADBBAAAByyDCADBACDBDDCDDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/xAArEQABAwIGAAQHAQAAAAAAAAABAAIRAxAEEiEiMUEgMFBgFDJRUmFjcoL/2gAIAQIBAT8A9ukgalMrse/I20iY9Gq4pjNBucsmIxGrtrUPh8N/Sdia1UxTasNRqUy5z3fN6JUxDKfPKjEV+drUKNOg1zsuZyJxNfja1MwbG6v3JrQ0QB6G5waJKc6rV/W1UW0Q7K3c77kAiOkBpYCbERaEQo8AE2IhELLogJtlsRCCgIiPMLg0SSjWc/Sk2UKDnmarpTWNYIa1dQjwulICHCjtOs2x4t0ukF+UeEeAiYyofVAartdo8ocr/KcPMLGuMuCAjwTeVKm02kqSpUqVNpU2m0qSpUlT7d//xAApEQABAwMBBgcBAAAAAAAAAAACAQMEABESIQUTIzFQUhAUIjJgYqFB/9oACAEDAQE/APjqIpLZKchvNM71wcfDFbXtp0aNs5971Fww+1b6BASzQ7xyi89tJfbi3+UECHFTKQ5kVT5bD6CDQ2EeiR4T8jVBxHuKkKDB5cZ38o5ciY4LauYiVIGzoWplvHKf2q8aYtDuxojM1uRXXoYCrhCKf2gCJGXXjO9o8qllMVvNzhh2+CLbl0UANxcQG60MRtr1SHsfqOq0s1tpMYzWP2L3U4646tzJS6ODzjYkIFjelVV1X51//8QAOxAAAQMBBAUHCwQDAQAAAAAAAQACAwQREiExEBMzUVIFFUFhcXKBFCAiMjRiY5GhorFAQlNgI4CCQ//aAAgBAQABPwL/AGyLg3Mp9RwqA2t8dJcG5lA24/0u2xPqOFFxccUyBzupMYGCwJz2tzKdUcIRJdmVFs29n9KfO1uWKc9z8ymQOd1JkTWJ0jWZlPqHHLBYlNhe7qTYGjPH+kvmaztT5XP7EyBzupMiaxPmY1Pnc7qQBdkm05PrYJsbG5D+kvkazNPnc7LBMhc7PBMiazRUEho7U2J7uhNpwPWQAGX9Jc4NzT6gn1U2F788EyJrNF5vEECDkUQCrWjMhX2cQ+avs4h80CDkQiQMyrzT0jTfZxD56SQMyr7OIK+ziCvs4ggQcjarzeIK+ziCvs4h80CDkQi4DMhX2cQ+avs4h80CDkdF9nENN5vEFmrzd4WaLmjpCBB6dF5vENN5ozIQIORGi0DMoOacnDzL7OIK+ziCDmnJw/VTOLW4IRSSYuQZHEnVHCoXFzLSp5NVE53T0INc68d2JVBJdeWHpy0cobRndUNK+Zt5pbnZiub5uJiZejmGOIdYq7YeKY4scHDoKY4Pa1w6QqqXVRHecBoGQ7NFXC+ZrAzevIZ+r56PIZ+r5qkifCxwdvVRt5e8UKGYi30V5BP7qpIHw371mK5Q2ze4o6WWVt5tli8gn91UxLahlm+xTbGXuO0U8mtha7p6VI8Rsc49ARN4k71S+zxdirPaZPD8KDYRd1VftEipKjVOsPqHRU7eTtUOxi7jUSGgk9CN+eU8TiqWTVzN3HA6K7YeK5P2j+7p5QJuMG8qKnfNbdswXkE/upsczHj0HWg7v1T3sbmnVBPqhCGR+J+qbAwdeivltcI935VHDZAb37/wnB0E1nS0pjg9rXDIhcobRndVNVNgYWlpONq5xZ/GVbemt3vVdsPFBpLXHcqCW1pjPRiFWyX5bo/bh4p7bji09CGQ7PMGY01G3l7xQr5AALjVzhJwNTHXmMdvaCuUduO4oawwsDLlq5yd/EPmqfGoj7ym2MvcKYwvNg3KgluyXOhy5Qk9WMdpTmlt23pFqpPZ41We0yeH4VPsIu6qv2iTtU1P/hjlZwC8qKo/8n/8lVO3k7VDsYu41V8l1gYP3fhcnx+tJ4BVkWqmO52IVNJrIm7xgVXbDxXJ21d3dPKIN2M9ahqHw23bMVzhP7qbXy2+kBZ+ofK1qMssnqhNpycXFNja3IaXuuMc49AQD55MMXHFeR1O76qWnmiF54VBLa0xnoxC5Q2jO6qSniljtcMbV5FT8P1TKWGN15rcVXbDxVCA4yg5Fq9Oln62qkj1s145DEqp28nahkOzzBmNNRt5e8Uyajui25luWuovc+SjlikwjdkuUduO4qSGJ8ILmAnFVtO1gD2CwZFcnuZi2wXt6m2MvcKovaG+KqWGCe0b7QmB1TPj0nFV22/5VJ7PGqz2mTw/Cp9hF3VV+0Sdqh2MfcCq6fUuvN9Q/ROcXkk5lQ7GLuBTvM8xs32NXkdTu+qfS1DWkkYDrVBJclun935VdsPFUcrInuLzYLF5ZTfyfQoVVO4gB+J6iqmfUXbWXryjqaZ9t+NrPqtdRe58k+y+6zK0/p3C1pTadozxQAHmzxGZl2/dVPSiAk3rSdEkYlY5p6VFRGGQPEuXUqil17gb9mG5QQ6ll223HTPFro7t6xQUuoLjftt6lUUonLTeumxQQiBl223rUlDrHufrc+rzebvi/bpkoL73O1uZ3Lm74v2rm74v2qnptQXenbb1KopNe8Ov2YWZKGLUxhltqc0OaWnpTKAxuDhNiOpPbfY5u8EKGj1MgfrLfBVFOJ2gW2EHNU9KILxvWkqek1771+zDcomaqNrLbbFNRa2Rz9ZZb1KNtxjW7gpaHWyOfrLLepMbcY1u4AJ7Q9paciubvi/Ras6nVh1no2WqGiETw+/b4aDiub7HWiazHDBTw66O7esXN3xftXN3xftTKC49rtbkbclPA2duJsIyK5u+L9q5u+L9qHJzbcZLfD/V3//EACoQAAIBAgUDBAMAAwAAAAAAAAABESExQVFhcfAQofEggZGxQGDBgNHh/9oACAEBAAE/If8ALJVKEhzp8xzW3L6lUoQhUln+ltEluglUSdSbM2y5UdBiGYB7p7jHksZ2L9JcIplYbdgqToLEq5sz4yKDSG2S22zDIamfgkkoX6RQr5EaHkLlQWJVzZRZl5IsVA2hG2V5thbSc/0lBVXIodAq9DUsyl59IicSLT7mX5IlhEv0lPLwUNY1Hk0M3csyl59Gu8u5YBrQgJUwx2o3PBjwYu62YglC3E9Cc9H18G62YW9DzZ5s8mhPQ2Ebhoe55M8GLutmMoSerg8GPBizr2ckwpZ5Pq10aXlImklNNaDW4anqxNImnQozU9WIJSPbpHdL3E01K6OgSerLutn0aEoW5QWHo+roebPNlBYej/Kld0wPJo1YilxObMNfdk0Zcs9uW5iFKbjILZs+5dObqMyBLEHkH/oeFhJRuXdpdcUyzSp/JI/+907d0XgpTOpoklNDRJZalzp0EgI6lNzU+Y3a0UQdg+2LNam7NT5kuovHIZdJbeXci0dMOa3Zt+53z76AeloO7/hV+rXTUTTUrp/BZFspJYzRKbDmRLG/6HS/tObr1WSdGT7Ct8JMnMxgJNzL8q61ORS4vsc2NRfatSCDnSt7hERrDVgbX2NbuDm6koEtHkRQlWNG7L+0Tm0Z9zG98RmN6I2+Ljt3o75egVvClmc1jnlH8wdq+2QEQxnMbgSiLC/6czkMd+T+Kkw//VFzFoprszsH99Adk+jjaFOsl7XLbtz66fwWRKqt2wqvXCpQKIW9ND3EX9vo6FFRNPuI1wkycSEll4oX5F3cvJDCIlp6QZ67SmG+El5NejpNC3EzJM6vwDm6ja+5Vc1HyESgZuS/tMNoMlrMfumOuvynT+3ejvl6BIXSHNBZnHYRNBxVlY7V9sbdDqe5g3wJbsasyyOZyOw+g10UPce2IWFWk7B/fQHZPo52hUvnAyHaZTUOrm4zmchtVTCFh9soh1tiUdT6i/tJuJG0/Rwf6iuVISzBaKlJYxb5LRKyirsanHYdn3Ivx3rrFNFZJJCSS9MLwTLpM6FB+RaI6YVS+TwJDGQ4d8YqJvHnMR1lsanMSYWaMBTiIOkyQxJMuESW2SmPMShJZehQaeHjHrY9M48zn5HPyNGrJYRaNYVGEE3WIuL1lI0yocJ5kqFFc3MEGaU/0ueQoSM9RIihpvKKv6e6BiDIwUrsozKuzSkxilq/6VSmubKBMMohnLzHEko0/YaajhR/eiJGmpTuX2hLJ7lQ3U5iTn5HPyLpo4aa5icmAOfkc/IUSdMlD/F3/8QAKBABAAIBAgUDBQEBAAAAAAAAAQARITFREEFhcfCBkbEgQGCh8cGA/9oACAEBAAE/EP8AmET8RdmG8tyo3x7VjLxoieqEemwsfwtqIBasu77fpLp0+nYJRp7+sOXJqrK+otqUFrnr+FCQZSAPoehLkznAwSjHv6wexe+YEgYXTWWQ9bCx2sPPLExetjK+u0gIKA/CLi0hilscGUae/rB7FmsYbZj7esuJW3+wzCbMspGk5jMD8IXNtMDViSyrQGsWLH56pRvXeWBUuKwGuzEc4dglEq9jBBhQ0D8Jr9EuGFa5mFHUbcqlE9d5eC6CGokTvB13EhJhHkF7ytFXQQfMOEgjyLmUB+JQA3VoD3YAXOQr7D9AgiCNiXwBEd5s+U/g5/BwkyBrmmw17ReDGkSVP5PgI8i5lAfiBl4sCw9eIggDg6ujVvUQyABarQG7BKqxaAPFVAMKI+0vjGihH1Iy28E+YYJRdjY+sQT3UEZQ83VofjgtQQ0iRPSAkESxGyuDvQoB9ll8KmUB+OFSDdWgPdiGBrQHG+OKCq0HoT+Dn8HGMDWgON8fdU7LgesuYLrq+hLn4OvNeGBJ1CVNoP0RD1PZShaurMZg8C8Tqiey0QbAeC8eqZE00Dh9Jyo+jo9GaCUdymj1IJ1UIduX6EIdrLVwsiAZWjvwsC7X2vFTyG8p0yGc/tY/mNtXh+V4oC8Z/azMqTRojFXnZwURFEbIdxUZqlAj1aBHltqzlVus8hvnk9Mv2U8+x+EQnIOhwAQRLEbKn7Sec2x3Kb2AuXd6QdD4EOt7+1xP8To41PWxLaVYtSO978A8qhRZ90MPNDUxK91uYyRu5sVJQpp5wAADEYWrOvBDylru8EuZnncEDLKAj66j1J4nVGPa2QagT+Il5JQdSZeDzXsXvBVcPmLjU9wvUo8QsHdQp6fSjz2/HyG8NiVskdagnxGDQQPB8ditTDcAUwlvM+xY8jvmnhOb1UHViO7yHSRhkIns0gOYiF9547dPJ6eAWPZfCW7J/tJNJo/tJ5zbFeB7kbQWvCpqV9bUmZ4X04/2PU1QP9WqV0nQ92INnxQfuA09VGKGeDVjwoVtDK91l3QPN1ZXA9LQw1ahbY1yboCUewQGwWo5MBPte7czxOqA3F4Zw+WyaavA847CUwPIWcTHiEtxhWhP2H0o89vx8hvLK4duVnM4InaEKaBSHB9bua6EE5Np+4yh8TfrrPkd/D631Q/duoLdWL5SIooBCeO3TyengF+m+EIkCII9sP5g87SqvAW1Vzy+2G8kA7DQECGA7BLd+CKgQ6UMDgPwx7toO1iunl1kxpWEpp7YLaaLjQ9jwGTUUq4KXFH26RAmLulRYRR7QEMaAV9OWJKmnyaiGpkh03DQrqObUR2l6284bH1gmiadCfjeOokhM6k4R6Wmnd3txgu+OP8AELbgd6PoPObcUyZqq7413xumnOzBH9LWrOYXectc9Do4SsTDbZqY5cxq6qlw9Ko60hzHVh04SYmcBpxCDS/y9OU8TnLVh3Pt7RsTk1mKrqHzTq4aOyWLdhVXVaWPiCOTTDlcrFzHl0LIWTBz1Hrp3cA3BQOiJSS5KOdVGTMXpEs/wyu+Nd8SO237vBzjqGZXfGu+LODc/wDLt//Z';
// ============================================================
// TOP NAVIGATION
// ============================================================


console.log("topNav.js loaded");
function renderNav() {
    const nav = document.getElementById('topNav');
    const isAdminUser = typeof isCurrentUserAdmin === 'function' && isCurrentUserAdmin();
    const role = typeof currentUserRole === 'function' ? currentUserRole() : null;
    // Admins are oversight-only — they don't register tyres/equipment or log
    // inspections themselves, so those operational pages aren't in their nav
    // at all. Since this app has no URL-based routing, removing a page from
    // this array means there's genuinely no way to reach it in normal use.
    // Users is admin-only. Analytics is hidden from Inspector. Export is
    // hidden from Inspector, Supervisor, and Internal User.
    let pages;
    if (isAdminUser) {
        pages = ['ADMIN', 'USERS', 'ANALYTICS', 'EXPORT'];
    } else {
        pages = ['DASHBOARD', 'TYRES', 'EQUIPMENT', 'INSPECTIONS', 'SWAP'];
        if (role !== 'Inspector') pages.push('ANALYTICS');
        if (!['Inspector', 'Supervisor', 'Internal User'].includes(role)) pages.push('EXPORT');
    }
    
    nav.innerHTML = `
        <header class="sticky top-0 z-40 shadow-md" style="background:#3d3c41">
            <div class="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
                <div class="flex items-center gap-2 text-white">
                    <div class="flex h-9 items-center rounded-md bg-white px-2 py-1">
                        <img src="${APM_LOGO_DATA_URI}" alt="APM Terminals" class="h-full w-auto object-contain" />
                    </div>
                    <div class="hidden sm:block">
                        <div class="text-sm font-bold leading-tight">TMA</div>
                        <div class="text-[10px] text-slate-300 leading-tight">Tyre Management App</div>
                    </div>
                </div>

                <!-- Desktop/tablet: full horizontal tab bar -->
                <nav class="no-scrollbar ml-2 hidden flex-1 overflow-x-auto md:flex">
                    <div class="flex gap-1" id="navContainer">
                        ${pages.map(p => `
                            <button class="nav-btn ${p === 'DASHBOARD' ? 'active' : ''} whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold tracking-wide transition-colors" 
                                    data-page="${p}" 
                                    style="${p === 'DASHBOARD' ? 'background:#6d6c70;color:#e2694a' : 'color:#cbd5e1'}"
                                    onclick="navigate('${p}')">
                                ${p}
                            </button>
                        `).join('')}
                    </div>
                </nav>

                <!-- Mobile: hamburger toggle, nav bar hidden above; spacer keeps
                     the right-hand controls pinned to the edge like on desktop -->
                <div class="flex flex-1 justify-end md:hidden">
                    <button id="mobileNavBtn" onclick="toggleMobileNav()" class="rounded-md p-2 text-slate-200 hover:bg-white/10" aria-label="Menu">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <line x1="3" y1="12" x2="21" y2="12"/>
                            <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                    </button>
                </div>

                <button id="themeToggle" class="shrink-0 rounded-full p-2 text-slate-200 hover:bg-white/10" aria-label="Toggle theme">
                    <svg id="themeIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                </button>
                <div class="relative shrink-0">
                    <button id="notifBtn" onclick="toggleNotifications()" class="relative rounded-full p-2 text-slate-200 hover:bg-white/10" aria-label="Notifications">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                        </svg>
                        <span id="notifBadge" class="absolute right-1 top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"></span>
                    </button>
                    <div id="notifPanel" class="fixed inset-x-3 top-16 z-50 hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-80 sm:max-w-[90vw]"></div>
                </div>
                <button onclick="navigate('PROFILE')" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-400 text-sm font-bold text-slate-900 transition hover:brightness-110" aria-label="Go to Profile" title="Profile">${typeof CURRENT_USER !== 'undefined' && CURRENT_USER ? CURRENT_USER.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : '?'}</button>
                <button onclick="logout()" class="shrink-0 rounded-md p-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white sm:px-2.5 sm:py-1.5" title="Log out">
                    <svg class="sm:hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <span class="hidden sm:inline">Log Out</span>
                </button>
            </div>

            <!-- Mobile dropdown: vertical stacked nav links, only used below md -->
            <div id="mobileNavPanel" class="hidden border-t border-white/10 md:hidden" style="background:#3d3c41">
                <div class="flex flex-col gap-1 px-3 py-2">
                    ${pages.map(p => `
                        <button class="mobile-nav-btn rounded-md px-3 py-2.5 text-left text-sm font-semibold tracking-wide transition-colors"
                                data-page="${p}"
                                style="${p === 'DASHBOARD' ? 'background:#6d6c70;color:#e2694a' : 'color:#cbd5e1'}"
                                onclick="navigate('${p}'); closeMobileNav();">
                            ${p}
                        </button>
                    `).join('')}
                </div>
            </div>
        </header>
    `;

    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', function() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('ftlms-theme', isDark ? 'dark' : 'light');
        const icon = document.getElementById('themeIcon');
        if (icon) {
            if (isDark) {
                icon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>';
            } else {
                icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
            }
        }
    });

    updateNotifications();
}

// Recomputes the notification badge count and dropdown contents from live
// tyre data (critical + warning status). Called on initial load and again
// anywhere tyre status can change (registering, editing, deleting a tyre,
// logging an inspection, swapping, etc.) — see the calls alongside
// renderDashboard() throughout the app, since they track the same data.
function updateNotifications() {
    const badge = document.getElementById('notifBadge');
    const panel = document.getElementById('notifPanel');
    if (!badge || !panel) return;

    const activeTyres = tyres.filter(t => !t.deleted);
    const criticalTyres = activeTyres.filter(t => t.status === 'critical');
    const warningTyres = activeTyres.filter(t => t.status === 'warning');
    const total = criticalTyres.length + warningTyres.length;

    if (total > 0) {
        badge.textContent = total > 99 ? '99+' : String(total);
        badge.classList.remove('hidden');
        badge.classList.add('flex');
    } else {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
    }

    const rows = [
        ...criticalTyres.map(t => ({ color: 'bg-red-500', text: `Critical tread on ${t.sn}${t.equip !== '—' ? ' (' + t.equip + ')' : ''}`, meta: `${t.tread}mm` })),
        ...warningTyres.map(t => ({ color: 'bg-amber-500', text: `Warning: ${t.sn} tread low`, meta: `${t.tread}mm` }))
    ];

    panel.innerHTML = `
        <div class="max-h-96 overflow-y-auto">
            <div class="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                <span class="text-sm font-bold text-slate-900">Notifications</span>
                <span class="text-xs text-slate-500">${total} alert${total === 1 ? '' : 's'}</span>
            </div>
            ${rows.length === 0 ? `
                <div class="px-4 py-8 text-center text-sm text-slate-500">No alerts — all tyres in good condition.</div>
            ` : `
                <ul class="divide-y divide-slate-100">
                    ${rows.slice(0, 8).map(r => `
                        <li class="flex items-start gap-2.5 px-4 py-3">
                            <span class="mt-1 h-2 w-2 shrink-0 rounded-full ${r.color}"></span>
                            <div class="min-w-0 flex-1">
                                <div class="text-sm text-slate-700">${escapeHtml(r.text)}</div>
                                <div class="text-xs text-slate-500">${escapeHtml(r.meta)}</div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `}
            <button onclick="navigate(typeof isCurrentUserAdmin === 'function' && isCurrentUserAdmin() ? 'ADMIN' : 'TYRES'); closeNotifications();" class="w-full border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-orange-600 hover:bg-slate-50">
                ${typeof isCurrentUserAdmin === 'function' && isCurrentUserAdmin() ? 'Back to Admin Dashboard →' : 'View all in Tyres →'}
            </button>
        </div>
    `;
}

function toggleNotifications() {
    const panel = document.getElementById('notifPanel');
    if (!panel) return;
    panel.classList.toggle('hidden');
}

function closeNotifications() {
    const panel = document.getElementById('notifPanel');
    if (panel) panel.classList.add('hidden');
}

function toggleMobileNav() {
    const panel = document.getElementById('mobileNavPanel');
    if (panel) panel.classList.toggle('hidden');
}

function closeMobileNav() {
    const panel = document.getElementById('mobileNavPanel');
    if (panel) panel.classList.add('hidden');
}

// Close the notifications dropdown and mobile nav panel when clicking
// anywhere outside them.
document.addEventListener('click', function (e) {
    const panel = document.getElementById('notifPanel');
    const btn = document.getElementById('notifBtn');
    if (panel && !panel.classList.contains('hidden') && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
        panel.classList.add('hidden');
    }

    const mobilePanel = document.getElementById('mobileNavPanel');
    const mobileBtn = document.getElementById('mobileNavBtn');
    if (mobilePanel && !mobilePanel.classList.contains('hidden') && mobileBtn && !mobilePanel.contains(e.target) && !mobileBtn.contains(e.target)) {
        mobilePanel.classList.add('hidden');
    }
});

// Tailwind's md breakpoint is 768px — if the window grows past it (e.g.
// rotating a tablet, resizing a browser), close the mobile menu so it
// doesn't sit open and orphaned once the desktop nav bar reappears.
window.addEventListener('resize', function () {
    if (window.innerWidth >= 768) closeMobileNav();
});