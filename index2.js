let NextPageUrl = "";
const base_url = 'https://pipedapi.kavin.rocks/'

const columns = document.querySelector("#columns");
const container = document.querySelector("#container");
const Cell = document.querySelector(".cell")
const inputField = document.querySelector("#input")
const inputForm = document.querySelector("#inputForm")
const selectField = document.querySelector("#select")
let isAtBottom = false;

function string_limit(str, maxLength = 10) {
    if (str.length > maxLength) {
        return str.slice(0, maxLength - 3) + "..";
    }
    return str;
}
function timeFormat(sec) {
    sec = Number(sec);
    var h = Math.floor(sec / 3600);
    var m = Math.floor(sec % 3600 / 60);
    var s = Math.floor(sec % 3600 % 60);

    var hDisplay = h > 0 ? (h < 10 ? "0" + h + ":" : h + ":") : "";
    var mDisplay = m > 0 ? (m < 10 ? "0" + m + ":" : m + ":") : "";
    var sDisplay = s >= 0 ? (s < 10 ? "0" + s : s) : "";
    return hDisplay + mDisplay + sDisplay;
}
// Get the query parameter
const urlParams = new URLSearchParams(window.location.search);
const query = urlParams.get("q");
if (query){
    inputField.value = query
}

//initial page load
piped_fetch(query)

// input field entry
inputForm.addEventListener("submit", e => {
    const newURL = new URL(window.location.href);
    e.preventDefault();

    if (inputField.value !== "") {
        const val = inputField.value
        const sel = selectField.value
        columns.innerHTML = ""
        piped_fetch(val, undefined, sel)

        newURL.searchParams.set('q', val);
        history.pushState({}, '', newURL)
    } else {
        columns.innerHTML = ""
        newURL.searchParams.delete('q');
        history.pushState({}, '', newURL)
        piped_fetch(null)
    }
})

async function piped_fetch(query, nextPageUrl, filter = "videos") {
    let url = query == null ? `${base_url}trending?region=IN` : `${base_url}search?q=${query}&filter=${filter}`

    if (nextPageUrl !== undefined) {
        url = `${base_url}nextpage/search?q=${query}&filter=videos&nextpage=${encodeURIComponent(nextPageUrl)}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data)

        if (data.items) {
            data.items.forEach(e => grid_loader(e))
        } else if (data.error) {
            console.error(data.error.message);
            const notify = document.createElement("p")
            notify.innerHTML = data.error.message
            container.appendChild(notify)
            return;
        } else {
            data.forEach(e => grid_loader(e))
        }

        NextPageUrl = data.nextpage;
        if (NextPageUrl) {
            window.addEventListener('scroll', function() {
                const scrollPosition = window.innerHeight + window.scrollY;
                const bodyHeight = document.body.offsetHeight;

                if (scrollPosition >= bodyHeight - 5 && !isAtBottom) {
                    isAtBottom = true;
                    piped_fetch(query, NextPageUrl);
                } else if (scrollPosition < bodyHeight - 5) {
                    isAtBottom = false;
                }
            });
        }
    } catch (err) {
        console.log(err);
    }
}

/*
grid loader
takes a object which contains all video details then Appends it to the container
*/
function grid_loader(e) {
    if (e.isShort) {
        return;
    }
    const cell = document.createElement("div");
    cell.setAttribute("class", "cell");

    const card = document.createElement("div");
    card.setAttribute("class", "card");

    const card_image = document.createElement("div");
    card_image.setAttribute("class", "card-image");

    const figure = document.createElement("figure");
    figure.setAttribute("class", "image is-16by9");
    figure.setAttribute("style", "overflow: hidden;")

    const img = document.createElement("img");
    img.setAttribute("id", "thumbnail");
    img.setAttribute("style", "object-fit: cover; object-position: center; width: 100%; height: 100%;")

    const title = document.createElement("div");
    title.setAttribute("class", "p-2 has-text-white is-size-7");

    const opener = document.createElement("a");
    const id = "https://piped.video" + e.url;
    opener.setAttribute("href", id);

    let vid_title = string_limit(e.title, 45);
    title.innerHTML = `${vid_title}`;
    img.src = e.thumbnail;

    const duration = document.createElement("div");
    duration.setAttribute("class", "duration");
    duration.innerHTML = timeFormat(e.duration);

    figure.appendChild(img);
    figure.appendChild(duration)
    card_image.appendChild(figure);
    card_image.appendChild(title);
    opener.appendChild(card_image);

    card.appendChild(opener);
    cell.appendChild(card);

    columns.appendChild(cell);
}
