import { Brand } from "@/components/brand";
import { BattleLaunchLink } from "@/components/battle-launch-link";
import { HomeAnalytics } from "@/components/home-analytics";
import { siteConfig } from "@/lib/config";

export default function HomePage() {
  return (
    <main id="main" className="home-shell">
      <HomeAnalytics />
      <nav className="topbar" aria-label="Main navigation">
        <Brand />
        <span className="online-pill"><i /> THE MOUTH IS READY</span>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span>3 ROUNDS</span><b>•</b><span>NO MERCY</span></div>
          <h1>
            <span className="hero-kicker">YO MAMA</span>
            <span className="hero-main">BATTLE<span className="lime-dot">.</span></span>
          </h1>
          <p className="hero-sub">Think you’re funny? Prove it.</p>
          <p className="hero-description">Step into the arena. Trade jokes with The Mouth and see who gets the last laugh.</p>
          <div className="hero-actions">
            <BattleLaunchLink />
            <span className="free-note">NO LOGIN <b>•</b> FREE TO PLAY</span>
          </div>
        </div>

        <div className="hero-stage" aria-label="Preview of the battle arena">
          <div className="burst burst-one">HA!</div>
          <div className="burst burst-two">OOOH</div>
          <div className="stage-card">
            <div className="stage-round">ROUND 1 <span>OF 3</span></div>
            <div className="versus-row">
              <div className="fighter ai-fighter"><div className="fighter-avatar">M</div><b>{siteConfig.opponent.name}</b><small>YOUR OPPONENT</small></div>
              <div className="versus-badge">VS</div>
              <div className="fighter user-fighter"><div className="fighter-avatar">YOU</div><b>YOU</b><small>BRAVE HUMAN</small></div>
            </div>
            <div className="speech-preview">“Yo mama so slow, her loading screen has a loading screen.”</div>
            <div className="crowd-meter"><span>CROWD</span><div><i /><i /><i /><i /><i /></div><b>LOUD</b></div>
          </div>
          <p className="swipe-note">TYPE YOUR BEST SHOT. THE JUDGES ARE WATCHING.</p>
        </div>
      </section>

      <section className="how-strip" aria-labelledby="how-heading">
        <h2 id="how-heading">HOW IT GOES DOWN</h2>
        <div className="how-grid">
          <article><span>01</span><div className="how-icon">⚡</div><h3>THE MOUTH SWINGS</h3><p>Your opponent drops a punchy opener.</p></article>
          <article><span>02</span><div className="how-icon">⌨</div><h3>YOU FIRE BACK</h3><p>Hit back before the clock runs out.</p></article>
          <article><span>03</span><div className="how-icon">★</div><h3>THE JUDGE RULES</h3><p>Creativity, savagery, and originality decide it.</p></article>
        </div>
      </section>

      <footer className="site-footer"><Brand compact /><p>The Mouth is an AI-powered comedy opponent. Battle scores are judged automatically.</p><span>© {new Date().getFullYear()} {siteConfig.name}</span></footer>
    </main>
  );
}
