document.addEventListener('DOMContentLoaded', () => {
    const STATIONS = {
        "KEXP": {
            name: "KEXP Seattle",
            url: "https://kexp.streamguys1.com/kexp320.aac",
            type: "audio/aac"
        },
        "ClassicFM": {
            name: "ClassicFM",
            url: "http://media-ice.musicradio.com/ClassicFMMP3",
            type: "audio/mp3"
        },
        "KDHX": {
            name: "KDHX",
            url: "http://kdhx-ice.streamguys1.com/live",
            type: "audio/mp3"
        },
        "Chill": {
            name: "Senza Chill",
            url: "http://151.80.43.143:8044/.mp3",
            type: "audio/aac"
        },
        "MotherEarth2": {
            name: "Mother Earth Radio",
            url: "http://server9.streamserver24.com:18900/motherearth.aac",
            type: "audio/aac"
        },
        "GRUNGE": {
            name: "GRUNGE",
            url: "https://streaming.live365.com/a48797",
            type: "audio/aac"
        },
        "GRUNGE2": {
            name: "GRUNGE2",
            url: "https://streams.radiobob.de/bob-grunge/mp3-192/streams",
            type: "audio/mp3"      
        },
        "JAZZ": {
            name: "JAZZ Spokane",
            url: "http://kewuradio.ewu.edu/KEWU_Jazz_89.5",
            type: "audio/aac"
        },
        "JRock": {
            name: "Radio Paradise - Jay Rock",
            url: "http://stream.radioparadise.com/rock-320",
            type: "audio/aac"
        },
        "MainMix": {
            name: "Radio Paradise Main Mix",
            url: "http://stream.radioparadise.com/aac-320",
            type: "audio/aac" // Assuming the stream type is flac; adjust if different
        },
        "Riverside": {
            name: "Riverside Radio",
            url: "https://stream.and-stuff.nl:8443/riversideMp3",
            type: "audio/mp3"
        },
        "KAMU": {
            name: "KAMU-FM Live Radio",
            url: "https://kamu.streamguys1.com/hd1-192",
            type: "audio/mp3"
        },
        "Classical": {
            name: "KAMU-Classical Live Radio",
            url: "https://kamu.streamguys1.com/hd2-192",
            type: "audio/mp3"
        },
        "WDET": {
            name: "WDET Detroit Public Radio",
            url: "https://wdet.streamguys1.com/live-aac256",
            type: "audio/aac"
        },
        "UKBlues": {
            name: "UK Blues",
            url: "https://bluesserver.rock-radio.uk/stream1",
            type: "audio/aac" // Assuming the stream type is flac; adjust if different
        },
        "BluesGold": {
            name: "Bluesmen Channel Gold",
            url: "http://vmi218518.contaboserver.net:8114/;",
            type: "audio/aac"
        },
        "INTENSE": {
            name: "Intense Radio",
            url: "https://intenseradio.live-streams.nl:18000/live",
            type: "audio/aac"
        },    
        "WOOD": {
            name: "WOOD_89.1",
            url: "https://streamdb3web.securenetsystems.net/CirrusOmni/index.cfm?stationCallSign=KCLC",
            type: "audio/mp3"
        }
    };

    const audio = document.querySelector('#stream');
    const currentlyPlayingArtist = document.querySelector('.currently-playing-artist');
    const currentlyPlayingTitle = document.querySelector('.currently-playing-title');
    const stationSelector = document.querySelector('#stationSelector');
    const playPauseButton = document.querySelector('[name="play-pause"]');
    const playPauseButtonIcon = playPauseButton.querySelector('i.fas');
    const volumeControl = document.querySelector('[name="volume"]');
    const volumeButton = document.querySelector('[name="mute"]');
    const volumeButtonIcon = volumeButton.querySelector('i.fas');

    const updateMediaSession = (title, artist, album = "Unknown Album", artworkUrl = "URL_TO_DEFAULT_ARTWORK") => {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: artist,
                album: album,
                artwork: [
                    { src: artworkUrl, sizes: '512x512', type: 'image/png' }
                ]
            });
        }
    };

    const setPlaybackState = (state) => {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = state;
        }
    };

    const setupMediaSessionHandlers = () => {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.setActionHandler("play", () => {
                audio.play();
                setPlaybackState('playing');
            });
        
            navigator.mediaSession.setActionHandler("pause", () => {
                audio.pause();
                setPlaybackState('paused');
            });
        }
    };

    let eventSource;
    let fetchMetadataTimeout;  // Declare the variable here.

    const setupEventSource = (stationKey) => {
        if (eventSource) {
            eventSource.close();
        }

eventSource = new EventSource(`/metadata/${stationKey}`);
        eventSource.onmessage = event => {
            const data = JSON.parse(event.data);
            console.log("Data received from EventSource:", data);  // Logging data from EventSource
            if (data.artist) {
                currentlyPlayingArtist.innerText = data.artist;

                // Fetch news for the artist
                fetch(`/artist-news/${encodeURIComponent(data.artist)}`)
                    .then(response => response.json())
                    .then(articles => {
                        // Display the news articles in your UI (this is a basic example)
                        const newsList = document.getElementById('newsList');
                        newsList.innerHTML = articles.map(article => `<li><a href="${article.url}" target="_blank">${article.title}</a></li>`).join('');
                    })
                    .catch(error => console.error("Failed to fetch artist news", error));

                // Fetch tour dates for the artist (placeholder for now)
                fetch(`/artist-tour/${encodeURIComponent(data.artist)}`)
                    .then(response => response.json())
                    .then(data => {
                        // Display the tour dates in your UI (this is a basic example)
                        const tourList = document.getElementById('tourList');
                        tourList.innerHTML = `<li>${data.tourDates}</li>`;
                    })
                    .catch(error => console.error("Failed to fetch artist tour dates", error));
            }
        };

        eventSource.onerror = event => {
            console.error("EventSource encountered an error:", event);
            setTimeout(() => setupEventSource(stationKey), 5000);  // Try to reconnect after 5 seconds
        };
    };

    const fetchMetadata = () => {
        fetch(`/metadata/${stationSelector.value}`)
            .then(response => response.json())
            .then(data => {
                console.log("Data fetched from /metadata:", data);
                if (data.artist) {
                    currentlyPlayingArtist.innerText = data.artist;
                }
                if (data.song) {
                    currentlyPlayingTitle.innerText = data.song;
                    updateMediaSession(data.song, data.artist); // Update MediaSession metadata
                }
            })
            .catch(error => console.error("Could not fetch metadata", error))
            .finally(() => {
                fetchMetadataTimeout = setTimeout(fetchMetadata, 5000);
            });
    };

    const initializeStation = (stationKey) => {
        const station = STATIONS[stationKey];
        audio.src = station.url;
        audio.type = station.type;
        currentlyPlayingTitle.innerText = station.name;
        currentlyPlayingArtist.innerText = "";
    
        setupEventSource(stationKey);
        clearTimeout(fetchMetadataTimeout); // Clear the previous timeout
        fetchMetadata(); // Fetch metadata for the new station
    };

    
    const updatePlayPauseIcon = () => {
        if (audio.paused) {
            playPauseButtonIcon.classList.remove('fa-pause');
            playPauseButtonIcon.classList.add('fa-play');
        } else {
            playPauseButtonIcon.classList.remove('fa-play');
            playPauseButtonIcon.classList.add('fa-pause');
        }
    };

    const updateVolumeIcon = () => {
        if (audio.muted || audio.volume === 0) {
            volumeButtonIcon.classList.remove('fa-volume-down');
            volumeButtonIcon.classList.add('fa-volume-mute');
        } else {
            volumeButtonIcon.classList.remove('fa-volume-mute');
            volumeButtonIcon.classList.add('fa-volume-down');
        }
    };

    // Populate station options
    for (let station in STATIONS) {
        let option = document.createElement('option');
        option.value = station;
        option.textContent = STATIONS[station].name;
        stationSelector.appendChild(option);
    }
    stationSelector.value = "KEXP";

    stationSelector.addEventListener('change', () => {
        audio.pause();
        initializeStation(stationSelector.value);
        audio.play();
    });

    playPauseButton.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
        updatePlayPauseIcon();
    });

    audio.addEventListener('play', updatePlayPauseIcon);
    audio.addEventListener('pause', updatePlayPauseIcon);

    volumeButton.addEventListener('click', () => {
        audio.muted = !audio.muted;
        updateVolumeIcon();
    });

    volumeControl.addEventListener('input', e => {
        audio.volume = e.target.value;
        audio.muted = false;
        updateVolumeIcon();
    });

    setupMediaSessionHandlers();

    initializeStation("KEXP");
});
