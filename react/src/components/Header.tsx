export function Header() {
  return (
    <header>
      <div className="title-bar">
        <div className="title-bar-inner">
          <h1 className="header-brand">
            <img src={`${import.meta.env.BASE_URL}smoking_gap_banner.png`} alt="SmokingGap" className="header-banner-img" />
          </h1>
        </div>
      </div>
    </header>
  );
}
