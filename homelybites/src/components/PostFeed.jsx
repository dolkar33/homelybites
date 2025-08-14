import React from "react";
import PersonIcon from "@mui/icons-material/Person";

// Helper to resolve author image across possible shapes
const getAuthorImage = (author) => {
  if (!author) return "";
  return (
    author.profile_image ||
    author.profileImage ||
    author.avatar ||
    author.profile?.profile_image ||
    author.profile?.profileImage ||
    author.user?.profile_image ||
    author.user?.profileImage ||
    author.user?.profile?.profile_image ||
    author.user?.profile?.profileImage ||
    ""
  );
};

function ExpandableDescription({ description }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!description) return null;
  const isLong = description.length > 60;
  return (
    <div className="text-gray-700 text-base whitespace-pre-line">
      {!expanded ? (
        <>
          <span
            className="truncate block overflow-hidden"
            style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}
          >
            {description}
          </span>
          {isLong && (
            <button className="text-xs text-red-500 ml-1 hover:underline" onClick={() => setExpanded(true)}>
              ...show more
            </button>
          )}
        </>
      ) : (
        <>
          <span>{description}</span>
          {isLong && (
            <button className="text-xs text-red-500 ml-2 hover:underline" onClick={() => setExpanded(false)}>
              show less
            </button>
          )}
        </>
      )}
    </div>
  );
}

const PostFeed = ({ posts, onLike, onSave, onAuthorClick, onDelete, showDelete, icons }) => {
  const { Heart, Bookmark } = icons || {};
  if (!Array.isArray(posts) || posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-lg text-gray-400">No posts yet!</div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-4">
          {/* Post Header */}
          <div className="p-4 sm:p-6 flex items-center">
            <div
              className="flex items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => onAuthorClick && onAuthorClick(post.author)}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mr-3 sm:mr-4 shadow-md flex items-center justify-center bg-gray-100">
                {getAuthorImage(post.author) ? (
                  <>
                    <img
                      src={getAuthorImage(post.author)}
                      alt={post.author?.name || "User"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div style={{ display: "none" }} className="items-center justify-center w-full h-full">
                      <PersonIcon style={{ fontSize: 24, color: "#9ca3af" }} />
                    </div>
                  </>
                ) : (
                  <PersonIcon style={{ fontSize: 24, color: "#9ca3af" }} />
                )}
              </div>

              <div>
                <h4 className="text-base sm:text-lg font-bold text-gray-800 hover:text-red-500 transition-colors">
                  {post.author?.name || "User"}
                </h4>
                <p className="text-sm sm:text-base text-gray-600 font-medium">{post.title}</p>
              </div>
            </div>
          </div>

          {/* Post Image (render only if image exists) */}
          {(post.image || post.image_url) && (
            <div className="px-6 pb-6">
              <div className="relative rounded-2xl overflow-hidden shadow-lg">
                <img src={post.image || post.image_url} alt={post.title} className="w-full h-80 object-cover" />
              </div>
            </div>
          )}

          {/* Post Description */}
          <div className="px-6 pb-6">
            <ExpandableDescription description={post.description} />
          </div>

          {/* Post Actions */}
          {Heart && Bookmark && (
            <div className="px-6 pb-6">
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => onLike && onLike(post.id)}
                  className={`flex items-center space-x-2 transition-all duration-200 ${post.isLiked ? "text-red-500" : "text-gray-600"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${post.isLiked ? "bg-red-100" : "bg-gray-100 hover:bg-gray-200"}`}
                  >
                    <Heart className={`w-5 h-5 ${post.isLiked ? "fill-current" : ""}`} />
                  </div>
                </button>

                <button
                  onClick={() => onSave && onSave(post.id)}
                  className={`flex items-center space-x-2 transition-all duration-200 ${post.isSaved ? "text-red-500" : "text-gray-600"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${post.isSaved ? "bg-red-100" : "bg-gray-100 hover:bg-gray-200"}`}
                  >
                    <Bookmark className={`w-5 h-5 ${post.isSaved ? "fill-current" : ""}`} />
                  </div>
                </button>

                {showDelete && onDelete && (
                  <button
                    onClick={() => onDelete(post.id)}
                    className="ml-auto px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    title="Delete post"
                  >
                    Delete
                  </button>
                )}
              </div>

              {post.likes > 0 && (
                <p className="text-gray-600 font-medium">
                  {post.likes} {post.likes === 1 ? "like" : "likes"}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostFeed;
