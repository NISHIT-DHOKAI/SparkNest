import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { postsAPI, reelsAPI } from "../services/api";
import { demoPosts, demoReels } from "../data/demoContent";
import "../assets/Home.css";

function Home() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState(demoPosts);
  const [reels, setReels] = useState(demoReels);
  const [loading, setLoading] = useState(Boolean(isAuthenticated));
  const [usingDemoPosts, setUsingDemoPosts] = useState(true);
  const [usingDemoReels, setUsingDemoReels] = useState(true);
  const [liked, setLiked] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      setPosts(demoPosts);
      setReels(demoReels);
      setUsingDemoPosts(true);
      setUsingDemoReels(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadDiscovery = async () => {
      setLoading(true);
      const [postResult, reelResult] = await Promise.allSettled([
        postsAPI.getPosts({ page: 1, limit: 12 }),
        reelsAPI.getReels({ page: 1, limit: 6 }),
      ]);

      if (cancelled) return;
      const livePosts = postResult.status === "fulfilled" ? postResult.value?.posts || [] : [];
      const liveReels = reelResult.status === "fulfilled" ? reelResult.value?.reels || [] : [];
      setPosts(livePosts.length ? livePosts : demoPosts);
      setReels(liveReels.length ? liveReels : demoReels);
      setUsingDemoPosts(!livePosts.length);
      setUsingDemoReels(!liveReels.length);
      setLoading(false);
    };

    loadDiscovery();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const handleLike = async (post) => {
    if (!isAuthenticated || post.isDemo || !post._id) return;
    const wasLiked = Boolean(liked[post._id]);
    setLiked((previous) => ({ ...previous, [post._id]: !wasLiked }));
    setPosts((current) => current.map((item) => item._id === post._id
      ? { ...item, likeCount: Math.max(0, (item.likeCount || 0) + (wasLiked ? -1 : 1)) }
      : item));
    try {
      await postsAPI.likePost(post._id);
    } catch (error) {
      setLiked((previous) => ({ ...previous, [post._id]: wasLiked }));
      setPosts((current) => current.map((item) => item._id === post._id
        ? { ...item, likeCount: Math.max(0, (item.likeCount || 0) + (wasLiked ? 1 : -1)) }
        : item));
      console.error("Like failed:", error);
    }
  };

  return (
    <main className="discovery-page">
      <section className="discovery-hero">
        <div className="hero-copy">
          <p className="eyebrow">A little inspiration, every day</p>
          <h1>{isAuthenticated ? `Good to see you${user?.name ? `, ${user.name.split(" ")[0]}` : ""}.` : "Make room for what inspires you."}</h1>
          <p className="hero-description">A calmer corner of the internet for the things you make, moments you keep, and people who get it.</p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link className="button button-primary" to="/create">Create something <span aria-hidden="true">↗</span></Link>
            ) : (
              <>
                <Link className="button button-primary" to="/register">Join SparkNest <span aria-hidden="true">↗</span></Link>
                <Link className="button button-quiet" to="/login">I already have an account</Link>
              </>
            )}
          </div>
          <div className="hero-note"><span className="note-dot" /> A thoughtful feed, made for you</div>
        </div>
        <div className="hero-art" aria-label="A quiet lakeside landscape and creative moments">
          <img className="hero-image-main" src={demoPosts[0].image} alt="Quiet lake between green mountains" />
          <img className="hero-image-small" src={demoPosts[1].image} alt="Sunlit leaves" />
          <div className="hero-art-caption"><span>FIELD NOTES</span><strong>Collect the little things.</strong></div>
          <div className="hero-art-spark" aria-hidden="true">✳</div>
        </div>
      </section>

      <section className="discovery-section reels-section" id="reels">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Short stories, on loop</p>
            <h2>Reels worth a pause</h2>
          </div>
          <Link className="text-link" to="/reels">Explore reels <span aria-hidden="true">→</span></Link>
        </div>
        <div className="demo-reel-grid">
          {reels.slice(0, 3).map((reel, index) => (
            <Link className={`demo-reel-card demo-reel-card-${index + 1}`} to="/reels" key={reel._id || index}>
              <img src={reel.thumbnail || demoReels[index % demoReels.length].thumbnail} alt="" loading="lazy" />
              <span className="reel-play" aria-hidden="true">▶</span>
              <span className="demo-badge">{usingDemoReels ? "DEMO REEL" : "REEL"}</span>
              <span className="demo-reel-caption"><strong>{reel.title}</strong><small>@{reel.user?.name || "creator"}</small></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="discovery-section gallery-section">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Fresh from the community</p>
            <h2>Little things, beautifully shared</h2>
          </div>
          <Link className="text-link" to={isAuthenticated ? "/posts" : "/register"}>{isAuthenticated ? "See all posts" : "Join the community"} <span aria-hidden="true">→</span></Link>
        </div>
        {loading ? (
          <div className="gallery-loading" aria-label="Loading posts"><span /><span /><span /></div>
        ) : (
          <div className="photo-grid">
            {posts.slice(0, 6).map((post, index) => {
              const creator = post.user?.name || demoPosts[index % demoPosts.length].user.name;
              return (
                <article className="photo-card" key={post._id || index}>
                  <Link className="photo-link" to={post.isDemo ? (isAuthenticated ? "/posts" : "/register") : `/posts/${post._id}`} aria-label={`View post: ${post.caption}`}>
                    <img src={post.image} alt={post.caption || "SparkNest community moment"} loading="lazy" />
                    {post.isDemo && <span className="demo-badge photo-demo-badge">{usingDemoPosts ? "DEMO PHOTO" : "PHOTO"}</span>}
                  </Link>
                  <div className="photo-card-meta">
                    <div><p>{post.caption}</p><span>by {creator}</span></div>
                    {isAuthenticated && !post.isDemo && (
                      <button className={`photo-like${liked[post._id] ? " is-liked" : ""}`} onClick={() => handleLike(post)} aria-label={liked[post._id] ? "Unlike post" : "Like post"}>
                        {liked[post._id] ? "♥" : "♡"}<span>{post.likeCount || 0}</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {!isAuthenticated && (
        <section className="closing-cta">
          <p className="eyebrow">Your story belongs here</p>
          <h2>Find your people. Share your spark.</h2>
          <Link className="button button-primary" to="/register">Create your free account <span aria-hidden="true">↗</span></Link>
        </section>
      )}
    </main>
  );
}

export default Home;
