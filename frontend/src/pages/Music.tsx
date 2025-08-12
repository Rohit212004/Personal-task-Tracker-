import React from "react";

const playlistId = "6vnqjviMZteGEPsC6YUTOr";

const Music: React.FC = () => {
  return (
    <div style={{ padding: "1rem" }}>
      <h1>Music Page</h1>
      <p>This is the music page where you can explore various music tracks.</p>

      <iframe
        title="Spotify Embed: Recommendation Playlist"
        src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
        width="100%"
        height="360"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ borderRadius: "8px" }}
      />
    </div>
  );
};

export default Music;
