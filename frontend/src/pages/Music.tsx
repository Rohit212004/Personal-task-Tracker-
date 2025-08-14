import React from "react";
import { Music2, Play, Headphones, Volume2 } from "lucide-react";
import { FaSpotify } from "react-icons/fa";

const playlistId = "6vnqjviMZteGEPsC6YUTOr";

const Music: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Music Hub</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Discover and enjoy curated playlists to enhance your productivity.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Headphones size={16} />
          <span>Powered by Spotify</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">

        {/* Music Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Playlist Type
              </h3>
              <Music2 className="text-green-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">Focus</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">productivity music</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Source
              </h3>
            
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">Spotify</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">streaming platform</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Experience
              </h3>
              <Headphones className="text-blue-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">HD</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">high definition</p>
          </div>
        </div>

        {/* Spotify Player Section */}
        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none p-8 rounded-2xl shadow border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <Play className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Now Playing
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Immerse yourself in productivity-boosting tracks
              </p>
            </div>
          </div>

          {/* Spotify Embed Container */}
          <div className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-gray-600/5 rounded-xl"></div>
            <div className="relative">
              <iframe
                title="Spotify Embed: Recommendation Playlist"
                src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
                width="100%"
                height="380"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-lg shadow"
              />
            </div>
          </div>

          {/* Music Tips */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0">
                <Headphones size={16} className="text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Best Experience</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use headphones for the best audio quality and focus.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0">
                <Volume2 size={16} className="text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Volume Control</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Keep volume at comfortable levels to maintain concentration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Music;
