from flask import Flask, jsonify, render_template
import requests

app = Flask(__name__)

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

# name, url template, status codes that mean "exists"
PLATFORMS = [
    ("GitHub",     "https://github.com/{u}",              [200]),
    ("Twitter/X",  "https://x.com/{u}",                   [200], 404),
    ("Instagram",  "https://www.instagram.com/api/v1/users/web_profile_info/?username={u}", [200]),
    ("TikTok",     "https://www.tiktok.com/@{u}",         [200]),
    ("Reddit",     "https://www.reddit.com/user/{u}/about.json", [200]),
    ("Telegram",   "https://t.me/{u}",                    [200], 404),
    ("YouTube",    "https://www.youtube.com/@{u}",        [200]),
    ("Twitch",     "https://m.twitch.tv/{u}",             [200], 404),
    ("SoundCloud", "https://soundcloud.com/{u}",          [200], 404),
    ("Steam",      "https://steamcommunity.com/id/{u}",   [200]),
    ("Pinterest",  "https://www.pinterest.com/{u}/",      [200], 404),
    ("Medium",     "https://medium.com/@{u}",             [200]),
    ("Spotify",    "https://open.spotify.com/user/{u}",   [200]),
    ("GitLab",     "https://gitlab.com/api/v4/users?username={u}", [200]),
    ("Bitbucket",  "https://api.bitbucket.org/2.0/users/{u}", [200]),
    ("npm",        "https://registry.npmjs.org/-/v1/user?name={u}", [200]),
    ("PyPI",       "https://pypi.org/user/{u}/",          [200], 404),
    ("Docker Hub", "https://hub.docker.com/v2/users/{u}/",[200], 404),
    ("Snapchat",   "https://www.snapchat.com/add/{u}",    [200]),
    ("Threads",    "https://www.threads.net/@{u}",        [200]),
    ("Facebook",   "https://www.facebook.com/{u}",        [200]),
    ("DeviantArt", "https://www.deviantart.com/{u}",      [200], 404),
    ("Behance",    "https://www.behance.net/{u}",         [200], 404),
    ("Vimeo",      "https://vimeo.com/{u}",               [200], 404),
    ("Flickr",     "https://www.flickr.com/people/{u}",   [200], 404),
    ("Tumblr",     "https://api.tumblr.com/v2/blog/{u}.tumblr.com/info", [200]),
    ("WordPress",  "https://{u}.wordpress.com",           [200], 404),
    ("Blogger",    "https://{u}.blogspot.com",            [200], 404),
    ("Chess.com",  "https://api.chess.com/pub/player/{u}",[200], 404),
    ("Last.fm",    "https://www.last.fm/user/{u}",        [200], 404),
    ("Letterboxd", "https://letterboxd.com/{u}/",         [200], 404),
    ("Goodreads",  "https://www.goodreads.com/{u}",       [200], 404),
    ("Kick",       "https://kick.com/api/v2/channels/{u}",[200], 404),
    ("Rumble",     "https://rumble.com/user/{u}",         [200], 404),
    ("Odysee",     "https://odysee.com/@{u}",             [200], 404),
    ("Roblox",     "https://www.roblox.com/search/users?keyword={u}", [200]),
    ("LinkedIn",   "https://www.linkedin.com/in/{u}",     [200]),
    ("Patreon",    "https://www.patreon.com/{u}",         [200], 404),
    ("Ko-fi",      "https://ko-fi.com/{u}",               [200], 404),
    ("BuyMeACoffee","https://buymeacoffee.com/{u}",       [200], 404),
]

def check(name, url_tpl, u, exists_codes=(200,), missing_codes=()):
    url = url_tpl.format(u=u)
    try:
        r = requests.get(url, headers=HEADERS, timeout=8, allow_redirects=False)
        if r.status_code in missing_codes:
            return {"name": name, "url": url, "exists": False, "status": r.status_code}
        if r.status_code in exists_codes:
            # فحص إضافي: بعض المواقع ترجع 200 لصفحة "not found"
            body = r.text[:3000].lower()
            fake = ["user-not-found", "page not found", "not found page",
                    "sorry, nobody on reddit", "can't find that user",
                    "profile doesn't exist", "error-404"]
            if any(f in body for f in fake):
                return {"name": name, "url": url, "exists": False, "status": r.status_code}
            return {"name": name, "url": url, "exists": True, "status": r.status_code}
        return {"name": name, "url": url, "exists": None, "status": r.status_code}
    except requests.RequestException:
        return {"name": name, "url": url, "exists": None, "status": "timeout/error"}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/scan/<username>")
def api_scan(username):
    import re
    if not re.match(r"^[a-zA-Z0-9._-]{1,40}$", username):
        return jsonify({"error": "invalid username"}), 400
    results = []
    for p in PLATFORMS:
        name, url = p[0], p[1]
        exists_c = p[2] if len(p) > 2 else (200,)
        missing_c = p[3] if len(p) > 3 else ()
        results.append(check(name, url, username, exists_c, missing_c))
    found = [r for r in results if r["exists"]]
    return jsonify({"username": username, "found_count": len(found), "results": results})

if __name__ == "__main__":
    app.run(debug=False, port=5000)
